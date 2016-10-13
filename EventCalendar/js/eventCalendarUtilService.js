/*
    This service provide utility functions that are independent of the controller code.
    MAybe this will be COTUtils or something
*/

(function () {
    'use strict';
    var eventCalendarUtilService = function() {
    

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
    }
    
 /* note you don't need to use eval, you can send the ng-model value quite easily 
      and that method is preferable especially if you are in an ng-repeat      
      For use with isteven-multi-select to limit the number of selections.
      currenty assumes disabled ind is "disabledInd" but that field is configurable in the control. should add as a parm)
*/

    function limitSelection(selected, modelData, modelField, maxSelects) {
        //Notice use of eval to check dynamic variables
        /*
        if ($scope.$eval(modelField).length === maxSelects) {
            angular.forEach( $scope.$eval(modelData), function(item, i) {
                if (item.ticked !== true) {
                    item.disabledInd = true;
                }
            });
        } else {
            angular.forEach( $scope.$eval(modelData), function(item, i) {
                item.disabledInd = false;
            }); 
        }
        */
        if (modelField.length >= maxSelects) {
            angular.forEach( modelData, function(item, i) {
                if (item.ticked !== true) {
                    item.disabledInd = true;
                }
            });
        } else {
            angular.forEach( modelData, function(item, i) {
                item.disabledInd = false;
            }); 
        }
    };
    
    /* when we clear the selection box, we make sure any disabled item is now enabled */
    function clearSelection(selected, modelData, modelField) {
        angular.forEach( modelData, function(item, i) {
            
            item.disabledInd = false;
        }); 
    };  
    
    
    function resetInputModel( modelField, selected, modelData) {
        angular.forEach( modelData, function(item, i) {
            angular.forEach( selected, function(selItem, j) {
                if (item[ modelField] === selItem[ modelField]) {
                    item.ticked = true;
                }
            });
        }); 
    return modelData;
    
    }

    var service = {
        guid : guid,
        limitSelection : limitSelection,
        clearSelection : clearSelection,
        resetInputModel : resetInputModel
        };
    return service;
    
    }


    angular.module('eventCalendarApp').factory('eventCalendarUtilService', eventCalendarUtilService);

}());