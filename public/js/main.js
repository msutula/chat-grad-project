(function() {
    var app = angular.module("ChatApp", []);

    app.controller("ChatController", function($scope, $http, $interval) {
        var self = this;
        $scope.loggedIn = false;
        $scope.showModal = false;
        $scope.showAddUsersModal = false;
        $scope.activeChatUser = "";
        $scope.activeChatGroup = "";
        $scope.tempUser = [];
        // REMOVE COMMENT TO POLL
        //$interval(reloadData, 2000);

        self.resetForm = function() {
            self.loading = false;
            self.newMessage = {
                body: ""
            };
        };

        function extract(result) {
            console.log(result.data);
            //if (result.status === 201) {
            //    self.todos[self.todos.length - 1].id = result.data;
            //}
            return result.data;
        }

        function displayConversations() {
            //console.log("Starting display conversations method for " + $scope.user._id);
            $http.get("/api/conversations").then(function(result) {
                console.log(result);
                $scope.userConversations = result.data;
            });
        }

        function displayGroups() {
            $http.get("/api/groups")
                .then(function(response) {
                    $scope.groups = extract(response);
                })
                .catch(function(error) {
                    self.error = "Failed to get groups. Server returned " +
                        error.status + " - " + error.statusText;
                })
        };

        function reloadData() {
            console.log($scope.activeChatUser);
            $http.get("/api/user").then(function(userResult) {
                $scope.loggedIn = true;
                $scope.user = userResult.data;
                $http.get("/api/users").then(function(result) {
                    $scope.users = result.data;
                    $scope.users = $scope.users.filter(function(item) {
                        if ($scope.user._id !== item.id) {
                            return item;
                        }
                    });
                    displayConversations();
                    displayGroups();
                    if($scope.activeChatUser !== null && $scope.activeChatUser !== undefined) {
                        console.log("Updating the display message " + $scope.activeChatUser);
                        self.displayMessages($scope.activeChatUser);
                    } else if($scope.activeChatGroup !== null && $scope.activeChatGroup !== undefined) {
                        console.log("Updating the display message " + $scope.activeChatGroup);
                        self.displayMessages($scope.activeChatGroup);
                    }
                });
            }, function() {
                $http.get("/api/oauth/uri").then(function(result) {
                    $scope.loginUri = result.data.uri;
                });
            });
        }

        $http.get("/api/user").then(function(userResult) {
            $scope.loggedIn = true;
            $scope.user = userResult.data;
            $http.get("/api/users").then(function(result) {
                $scope.users = result.data;
                $scope.users = $scope.users.filter(function(item) {
                    if ($scope.user._id !== item.id) {
                        return item;
                    }
                });
                displayConversations();
                displayGroups();
            });
        }, function() {
            $http.get("/api/oauth/uri").then(function(result) {
                $scope.loginUri = result.data.uri;
            });
        });

        //self.displayConversations = function() {
        //    console.log("Starting display conversations method for " + $scope.user._id);
        //    $http.get("/api/conversations").then(function(result) {
        //        console.log(result);
        //        $scope.userConversations = result.data;
        //    });
        //};

        self.displayMessages = function(user) {
            console.log("Sending message to " + user.id);
            $scope.activeChatUser = user;
            console.log("Active Chat User " + $scope.activeChatUser);
            var messageTo = user.id;
            var placeholderMessage = {
                    seen: true
                };
            self.sendingMessage = angular.copy(user);
            self.isSendingMessage = true;
            self.isSendingGroupMessage = false;
            $http.get("/api/user").then(function(userResult) {
                console.log($scope.user._id);
                console.log("Entering put field with " + placeholderMessage.seen);
                $http.put("/api/conversations/" + messageTo, placeholderMessage).then(function(result) {
                    console.log("result of update");
                    console.log(result);
                });
                $http.get("/api/conversations/" + messageTo).then(function(result) {
                    console.log("result");
                    console.log(result);
                    $scope.conversations = result.data;
                });
            }, function() {
                $http.get("/api/oauth/uri").then(function(result) {
                    $scope.loginUri = result.data.uri;
                });
            });
        };

        self.displayGroupMessages = function(group) {
            console.log("Sending message to " + group.id);
            $scope.activeChatGroup = group;
            self.getGroupUsers(group);
            console.log("Active Chat Group " + $scope.activeChatGroup);
            var messageTo = group.id;
            var placeholderMessage = {
                seen: true
            };
            self.sendingMessage = angular.copy(group);
            self.isSendingGroupMessage = true;
            self.isSendingMessage = false;
            console.log($scope.user._id);
            console.log("Entering put field with " + placeholderMessage.seen);
            $http.put("/api/groups/conversations/" + messageTo, placeholderMessage).then(function(result) {
                console.log("result of update");
                console.log(result);
            });
            $http.get("/api/groups/conversations/" + messageTo).then(function(result) {
                console.log("result");
                console.log(result);
                $scope.conversations = result.data;
            });
        };

        self.setSentMessage = function (user) {
            console.log("Sending message to " + user.id);
            self.sendingMessage = angular.copy(user);
            self.isSendingMessage = true;
        };

        self.sendMessage = function (user, message, isValid) {
            console.log(user);
            if (isValid) {
                self.loading = true;
                message.sent = Math.floor(Date.now());
                console.log(message);
                $http.post("/api/conversations/" + user.id, message)
                    .then(function(response) {
                        extract(response);
                        if (!user.title) {
                            $scope.conversations = self.displayMessages(user);
                        } else {
                            $scope.conversations = self.displayGroupMessages(user);
                        }
                        self.resetForm();
                    })
                    .catch(function(error) {
                        self.error = "Failed to create message. Server returned " +
                            error.status + " - " + error.statusText;
                    });
            }
        };

        //self.displayGroups = function() {
        //    $http.get("/api/groups")
        //        .then(function(response) {
        //            $scope.groups = extract(response);
        //        })
        //        .catch(function(error) {
        //            self.error = "Failed to get groups. Server returned " +
        //                    error.status + " - " + error.statusText;
        //        })
        //};

        self.displayGroupDetails = function(group) {
            $http.get("/api/groups/" + group.id)
                .then(function(response) {
                    extract(response);
                })
                .catch(function(error) {
                    self.error = "Failed to get group. Server returned " +
                        error.status + " - " + error.statusText;
                })
        };

        self.createGroup = function(group, isValid) {
            if (isValid) {
                //var groupObject = new Object();
                //groupObject.title = "Test title";
                console.log(group);
                $http.put("/api/groups/" + group.id, group)
                    .then(function(response) {
                        extract(response);
                        $scope.showModal = false;
                        reloadData();
                    })
                    .catch(function(error) {
                        self.error = "Failed to create group. Server returned " +
                                error.status + " - " + error.statusText;
                    });
            }
        };

        self.removeGroup = function(group) {
            $http.delete("/api/groups/" + group.id);
        };

        self.addUserToGroup = function(users) {
            console.log("Adding user to group");
            $http.put("/api/groups/" + "first-group" + "/users/" + "jackarnstein")
                .then(function(response) {
                    extract(response);
                    $scope.showAddUsersModal = false;
                })
                .catch(function(error) {
                    self.error = "Failed to create group. Server returned " +
                        error.status + " - " + error.statusText;
                });
        };

        self.getGroupUsers = function(group) {
            console.log("Get group details for: " + group.id);
            console.log(group);
            $http.get("/api/groups/" + group.id + "/users")
                .then(function(response) {
                    $scope.groupsUsers = extract(response);
                    console.log("Group members: ");
                    console.log($scope.groupsUsers);
                })
                .catch(function(error) {
                    self.error = "Failed to get users of the group. Server returned " +
                            error.status + " - " + error.statusText;
                })
        }

        self.removeGroupUser = function() {
            $http.delete("/api/groups/" + "first-group" + "/users/" + "jackarnstein")
                .then(function(response) {
                    extract(response);
                })
                .catch(function(error) {
                    self.error = "Failed to remove user from the group. Server returned " +
                            error.status + " - " + error.statusText;
                })
        };

        $scope.toggleModal = function() {
            $scope.showModal = !$scope.showModal;
        }

        $scope.toggleShowAddUsersModal = function() {
            $scope.showAddUsersModal = !$scope.showAddUsersModal;
        }

        self.addUserTemp = function(item) {
            console.log("Adding to tempUser");
            console.log(item);
            $scope.tempUser.push(item);
        }
    });
    app.filter("searchFor", function() {
        return function(arr, searchString) {
            if (!searchString) {
                return arr;
            }

            var result = [];

            searchString = searchString.toLowerCase();

            angular.forEach(arr, function(item) {
                //console.log(item); NEED TO CHANGE TO NAME, NOT ID.lowercase
                if (item.id.toLowerCase().indexOf(searchString) !== -1) {
                    result.push(item);
                }
            });
            return result;
        };
    });

    app.directive("modal", function() {
        return {
            template: '<div class="modal fade">' +
            '<div class="modal-dialog">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
            '<h4 class="modal-title">{{ title }}</h4>' +
            '</div>' +
            '<div class="modal-body" ng-transclude></div>' +
            '</div>' +
            '</div>' +
            '</div>',
            restrict: 'E',
            transclude: true,
            replace:true,
            scope:true,
            link: function postLink(scope, element, attrs) {
                console.log(attrs.title);
                scope.title = attrs.title;

                scope.$watch(attrs.visible, function(value){
                    if(value == true)
                        $(element).modal('show');
                    else
                        $(element).modal('hide');
                });

                $(element).on('shown.bs.modal', function(){
                    scope.$apply(function(){
                        scope.$parent[attrs.visible] = true;
                    });
                });

                $(element).on('hidden.bs.modal', function(){
                    scope.$apply(function(){
                        scope.$parent[attrs.visible] = false;
                    });
                });
            }
        };
    })
})();
