/// <reference path='../_all.ts' />

// Some generic directives to make our lives easier.

var mod: ng.IModule = angular.module("scrumdoGenericDirectives", []);

//mod.service('mouseDownService', scrumdo.MouseDownService);
mod.directive('sdAutoscrollHorizontal', scrumdo.autoscrollHorizontalDirective);
mod.directive('sdAutoscrollVertical', scrumdo.autoscrollVerticalDirective);

/* Link catcher is for the read only display of user editable fields,
# it catches clicks on the field, and if it's a click on a link it
# will add a target=_blank to the link so we open in a new window.
# Also, if it's a permalink, we will broadcast permalink_clicked
# with the event as an argument.  That lets other components handle the
# permalink click in alternate ways, like just opening the edit-card window
# if we're already on a page capable of displaying it.  If another component
# does handle the click, it probably wants to call preventDefault as well.
*/
mod.directive('sdLinkCatcher', () => {
    return (scope, element, attrs) => {
        element.bind("click", (event) => {
            if (event.target.nodeName === 'A') {
                if (event.target.getAttribute('href').indexOf('story_permalink') !== -1) {
                    scope.$root.$broadcast('permalink', event);
                }
                event.target.setAttribute('target', '_blank');
            }
        });
    }
});

// Add an sd-enter attribute that evaluates on enter key
// <input sd-enter="myFunction()" />
mod.directive('sdEnter', () => {
    return (scope, element, attrs) => {
        element.bind("keydown keypress", (event) => {
            if (event.which === 13) {
                event.preventDefault();
                scope.$apply(() => {
                    scope.$eval(attrs.sdEnter, {$event: event});
                });
            }
        });
    }
});

mod.controller("CSRFController", ["$scope", "$cookies", ($scope, $cookieStore) => {
    $scope.csrf_token = $cookieStore.get('csrftoken');
}]);

mod.directive("sdCsrf", ($cookies) => {
    return {
        restrict: "E",
        template: "<div style='display:none'><input type='hidden' name='csrfmiddlewaretoken' value='{{ csrf_token }}' /></div>",
        controller: "CSRFController"
    }
});


// Apply this directive to elements that only org staff members should be able to see.
// It relies on the user object set in the root scope by UserService
mod.directive("sdStaffOnly", () => {
    return {
        restrict: "A",
        controller: "CSRFController",
        link: ($scope: any, $element, $attr) => {
            var checkAccess;
            checkAccess = function() {
                if (!$scope.user || !$scope.user.staff) {
                    return $element.hide();
                } else {
                    return $element.show();
                }
            };
            checkAccess();
            return $scope.$on('accessChanged', checkAccess);
        }
    };
});

mod.directive("sdNotStaffOnly", () => {
    return {
        restrict: "A",
        controller: "CSRFController",
        link: ($scope: any, $element, $attr) => {
            var checkAccess;
            checkAccess = function() {
                if ((!$scope.user) || $scope.user.staff) {
                    return $element.hide();
                } else {
                    return $element.show();
                }
            };
            checkAccess();
            return $scope.$on('accessChanged', checkAccess);
        }
    };
});

mod.directive('convertToNumber', () => {
    return {
        require: 'ngModel',
        link: (scope, element, attrs, ngModel: any) => {
            ngModel.$parsers.push((val) => {
                return parseInt(val, 10);
            });
            ngModel.$formatters.push((val) => {
                return '' + val;
            });
        }
    };
});

mod.directive('numbersOnly', () => {
    return {
        require: 'ngModel',
        link: (scope, element, attrs, modelCtrl: ng.INgModelController) => {
            modelCtrl.$parsers.push((inputValue) => {
                // this next if is necessary for when using ng-required on your input. 
                // In such cases, when a letter is typed first, this parser will be called
                // again, and the 2nd time, the value will be undefined
                if (inputValue == undefined) return ''
                var transformedInput = parseInt(inputValue.toString().replace(/[^0-9]/g, ''));
                if(isNaN(transformedInput)) transformedInput = null;
                if (transformedInput != inputValue) {
                    modelCtrl.$setViewValue(transformedInput);
                    modelCtrl.$render();
                }
                return transformedInput;
            });
        }
    };
});


mod.directive('alphaNumbersOnly', () => {
    return {
        require: 'ngModel',
        link: (scope, element, attrs, modelCtrl: ng.INgModelController) => {
            modelCtrl.$parsers.push((inputValue) => {
                // this next if is necessary for when using ng-required on your input. 
                // In such cases, when a letter is typed first, this parser will be called
                // again, and the 2nd time, the value will be undefined
                if (inputValue == undefined) return ''
                var transformedInput = inputValue.toString().replace(/[^a-zA-Z0-9]/g, '');
                if (transformedInput != inputValue) {
                    modelCtrl.$setViewValue(transformedInput);
                    modelCtrl.$render();
                }
                return transformedInput;
            });
        }
    };
});

mod.directive('capitalize', () => {
    return {
      require: 'ngModel',
      link: (scope, element, attrs, modelCtrl:any) => {
        var capitalize = (inputValue) => {
          if (inputValue == undefined) inputValue = '';
          var capitalized = inputValue.toUpperCase();
          if (capitalized !== inputValue) {
            modelCtrl.$setViewValue(capitalized);
            modelCtrl.$render();
          }
          return capitalized;
        }
        modelCtrl.$parsers.push(capitalize);
        capitalize(scope[attrs.ngModel]);
      }
    };
});


mod.directive('svgConnect', ($timeout) => {
  return {
    link: (scope, element, attrs, modelCtrl: any) => {
      $(element[0]).css({
        position: 'absolute',
      }).empty();
      var layout = attrs["layout"] != null ? attrs["layout"] : 'vertical';
      var stroke = attrs["stroke"] != null ? attrs["stroke"] : '#aeaeae';
      var strokeWidth = attrs["strokewidth"] != null ? attrs["strokewidth"] : 1;
      var strokeDasharray = attrs["strokedasharray"] != null ? attrs["strokedasharray"] : "0";
      console.log(layout)
      scope.$on("drawSvgConnectors", () => {
        if (scope.$root["svgConnectorsData"] != null) {
          $timeout(() => {
            if (element[0].offsetParent != null) {
              $(element[0]).HTMLSVGconnect({
                strokeWidth: strokeWidth,
                stroke: stroke,
                strokeDasharray: strokeDasharray,
                orientation: layout,
                paths: scope.$root["svgConnectorsData"]
              });
            }
          }, 10);
        }
      });
    }
  }
});


mod.directive('backImg', () => {
    return (scope, element, attrs) => {
        var url = attrs.backImg;
        attrs.$observe('backImg', (val) => {
            element.css({
                'background-image': 'url(' + val +')',
                'background-size' : 'cover'
            });
        });
    };
});