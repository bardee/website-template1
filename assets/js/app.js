var app = angular.module('myapp', []);
app.controller('myctrl', ['$scope', '$http', '$filter', function($scope, $http, $filter) {
    $scope.services = [];
    $scope.ratings = [];
    $scope.pgtrack = 1;


    //gets pulls data from the database
    $http.get('https://shops.tryvitris.com/getdata/2')
        .then(function successCallback(resp) {
            $scope.services = resp.data.services;
            $scope.ratings = resp.data.ratings;
            $('#testimonials').removeClass('hidden').addClass('carousel slide');
            $('#testimonials').attr('data-ride', 'carousel');
            $scope.services = groupStuff($scope.services, ['brand', 'deviceName', 'color'], ['brand', 'deviceName', 'color', 'customerPartColor', 'partNameCustomer', 'price']);

            //Makes the prices and, part color, device issue name into an array of issue objects
            for (i in $scope.services) {
                $scope.services[i].issues = [];
                var issue = {};
                if (Array.isArray($scope.services[i].customerPartColor)) {
                    for (j in $scope.services[i].customerPartColor) {
                        issue = {
                            color: $scope.services[i].customerPartColor[j],
                            price: $scope.services[i].price[j],
                            partNameCustomer: $scope.services[i].partNameCustomer[j]
                        };
                        $scope.services[i].issues.push(issue);
                    }
                } else {
                    issue = {
                        color: $scope.services[i].customerPartColor,
                        price: $scope.services[i].price,
                        partNameCustomer: $scope.services[i].partNameCustomer
                    };
                    $scope.services[i].issues.push(issue);
                }

                delete $scope.services[i].price;
                delete $scope.services[i].partNameCustomer;
            }
            var r = [];
            var q = {};
            var push = true;
            for (i in $scope.services) {
                for (j in $scope.services[i].issues) {
                    if (r.length == 0) {
                        q = {};
                        q.color = $scope.services[i].issues[j].color;
                        q.issues = []
                        q.issues.push({
                            partNameCustomer: $scope.services[i].issues[j].partNameCustomer,
                            price: $scope.services[i].issues[j].price
                        });
                        r.push(q);
                    } else {
                        for (k in r) {
                            if ($scope.services[i].issues[j].color == r[k].color) {
                                q = {};
                                q.issues = {
                                    partNameCustomer: $scope.services[i].issues[j].partNameCustomer,
                                    price: $scope.services[i].issues[j].price
                                };
                                r[k].issues.push(q.issues);
                                push = false;
                                break;
                            }
                        }
                        if (push) {
                            q = {};
                            q.color = $scope.services[i].issues[j].color;
                            q.issues = []
                            q.issues.push({
                                partNameCustomer: $scope.services[i].issues[j].partNameCustomer,
                                price: $scope.services[i].issues[j].price
                            });
                            r.push(q);
                        }
                    }
                    push = true;
                }
                $scope.services[i].customerPartColor = r;
                delete $scope.services[i].issues;
                r = [];
            }

            $scope.servPgn = paginate($scope.services, 8, 4);
        }, function errorCallback(resp) { console.log(resp) });

    //changes the information in a modal
    $scope.updateModalInfo = function(info) {
        $scope.modalInfo = info;
        $scope.selectedPartColor = "";
    }

    $scope.servManNav = function(e, go, scroll) {
        var start = $scope.servPgn.getCurPg();
        if (e.keyCode == 13 || e.type == 'blur') {
            $scope.servPgn.navigate(go);
        }
        if ($scope.servPgn.getCurPg() !== start) {
            $scope.scrolly(scroll);
        }
    }

    //filters the pagination pages
    $scope.filter = function(search) {
        $scope.servPgn.update($filter('filter')($scope.services, search));
        $scope.pgtrack = $scope.servPgn.getCurPg();
    }

    //accessible version of general range function below
    $scope.range = function(start, end) {
        return range(start, end);
    }
    $scope.scrolly = function(where) {
        return scrolly(where);
    }

}]);


/*PURPOSE: Groups an object by specfied properties
INPUT:
  obj - object to form grouping on,
  groupBy - properties to group the object group by
  extract - properties to extract and be applied to return object
OUTPUT: object that has been grouped by specfied properties*/

function groupStuff(obj, groupBy, extract) {
    var ret = []; //return value
    var extracted = {}; //temp object for the extracted data
    var insertIndex = 0; //where to place additional extracted data based on the grouping
    var canPush = 0; //counter for pushing extracted content withough merging

    for (x in obj) {
        for (y in ret) {
            for (z in groupBy) {
                if (obj[x][groupBy[z]] == ret[y][groupBy[z]]) {
                    canPush++;
                }
            }
            if (canPush == groupBy.length) {
                insertIndex = y;
                break;
            } else {
                canPush = 0;
            }
        }
        if (canPush == 0 || canPush < groupBy.length) {
            for (i in extract) {
                extracted[extract[i]] = obj[x][extract[i]];
            }
            ret.push(extracted);
        } else {
            for (i in extract) {
                if ((ret[insertIndex][extract[i]] == obj[x][extract[i]]) && groupBy.indexOf(extract[i]) != -1) {
                    extracted[extract[i]] = obj[x][extract[i]];
                } else {
                    extracted[extract[i]] = [];
                    if (Array.isArray(ret[insertIndex][extract[i]])) {
                        extracted[extract[i]] = ret[insertIndex][extract[i]].slice(0);
                    } else {
                        extracted[extract[i]].push(ret[insertIndex][extract[i]]);
                    }
                    extracted[extract[i]].push(obj[x][extract[i]]);
                }
            }
            ret[insertIndex] = extracted;
        }
        canPush = 0;
        extracted = {};
    }
    return ret;
}

/*PURPOSE: Creates a pagination object to easily create and control pagination
INPUT:
  itemsArr - array of objects to make paignation for
  itermsPerPg - maximum number of items on a page
  numTabsShow - maximum number of tabs to show at a time
OUTPUT: a pagination object*/
function paginate(itemsArr, itemsPerPg, numTabsShow) {
    var currentPg = 1;
    var items = itemsArr;
    var maxItems = itemsPerPg;
    var pages = Math.ceil(items.length / maxItems);
    var tabsShow;
    var pgTabs;

    if ((typeof numTabsShow == 'number') && numTabsShow > 0 && numTabsShow < pages) {
        tabsShow = numTabsShow;
        pgTabs = range(1, numTabsShow);
    } else {
        tabsShow = pages;
        pgTabs = range(1, pages);
    }

    return {
        //sets the max items per page
        setIPP: function(itemsPP) {
            if (typeof itemsPP == 'number') {
                maxItems = itemsPP;
                pages = Math.ceil(items.length / maxItems);
                if (currentPg > pages) {
                    currentPg = pages;
                }
            }
        },
        //gets the items per page
        getIPP: function() {
            return maxItems;
        },
        //gets the current page
        getCurPg: function() {
            return currentPg;
        },
        //gets the amount of pages there are
        getNumPgs: function() {
            return pages;
        },
        //returns an array of the items to be displayed on the page
        displayPg: function() {
            var pgView = [];
            sliceFrom = (currentPg * maxItems) - maxItems;
            sliceTo = sliceFrom + maxItems;
            pgView = items.slice(sliceFrom, sliceTo);
            return pgView;
        },
        //returns an array of the tabs to be displayed
        getPgTabs: function() {
            return pgTabs;
        },
        //handles the controls to navigate the pages
        navigate: function(goTo) {
            if (typeof goTo == "string" && isNaN(parseInt(goTo, 10))) {
                if ((goTo === "next") && !(currentPg + 1 > pages)) {
                    currentPg++;
                    if ((currentPg - 1 == pgTabs[pgTabs.length - 1]) && (pages - currentPg > tabsShow)) {
                        for (i in pgTabs) {
                            pgTabs.shift();
                            pgTabs.push(pgTabs[pgTabs.length - 1] + 1);
                        }
                    } else if ((pages - currentPg < tabsShow) && (pgTabs[pgTabs.length - 1] < pages)) {
                        pgTabs.shift();
                        pgTabs.push(pgTabs[pgTabs.length - 1] + 1);
                    }
                }
                if ((goTo === "back") && !(currentPg - 1 < 1)) {
                    currentPg--;
                    if ((currentPg % tabsShow == 0) && (pgTabs.indexOf(currentPg) == -1)) {
                        for (i in pgTabs) {
                            pgTabs.pop();
                            console.log();
                            pgTabs.splice(0, 0, pgTabs[0] - 1);
                        }
                    } else if ((pgTabs[pgTabs.length - 1]) % tabsShow != 0) {
                        pgTabs.pop();
                        pgTabs.splice(0, 0, pgTabs[0] - 1);
                    }
                }
            }
            if (((typeof goTo == 'number') || !isNaN(parseInt(goTo, 10))) &&
                (goTo != currentPg) && (goTo <= pages) && (goTo > 0)) {
                currentPg = Math.floor(goTo);
            }
        },
        //updates the items to be displayed
        update: function(itemsRep) {
            items = itemsRep;
            pages = Math.ceil(items.length / maxItems);
            if (currentPg == 0 && pages != 0) {
                currentPg = 1;
            }
            if (pages < maxItems) {
                tabsShow = pages;
                pgTabs = range(1, tabsShow);
            }
            if (currentPg > pages) {
                currentPg = pages;
            }
        }
    }
}

/*PURPOSE: Creates a range of numbers
INPUT:
  start - the starting value of the range
  end - ending range value
OUTPUT: array of numbers ranging from start to (and including) the end*/
function range(start, end) {
    var ret = [];
    if (start > end) {
        return ret;
    }
    for (var i = start; i <= end; i++) {
        ret.push(i);
    }
    return ret;
}

function scrolly(where) {
    $('html, body').animate({
        scrollTop: $(where).offset().top
    }, 500);
}