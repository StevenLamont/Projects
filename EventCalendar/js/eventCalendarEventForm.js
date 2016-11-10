 (function () {  
    /*
      The directive 
      (1)loads the form.
      (2) set required fields
      (3) pre-pends labels of required fields with an asterik
      
	  I encountered a problem with controller AS: to search the form I need the ec. convention, but showErrors needs scope variables and thus needs vm.
	  It happens that both ec. and vm. works in the form.
    */
    
    var directive = function ($compile, $log) {
        return {

        //controller: 'EventCalendarController',  careful here, I added this and since i also defined ng-controller on the form, it kicked in twice.
        restrict: 'A',
        scope: {},
        priority: 10,
        //templateUrl: '/webapps/eventCal/Submission/html/eventcal.html',
        templateUrl: 'html/eventcal.html',

        //Once loaded add required class to all labels where data related field is required.  The label-for must be used.
        //For radio buttons, the label for would be for the group from-control/main div so we ignore looking at ..
        
        /* for conditional required implemented via a VM function, this is hard to turn off/on here (ex: location districts) here 
            This was really implemented so I could easily turn off required fields during testing. Conditional required fields will not be in
            this list..
                    <!-- if I use ng-if instead of ng-show, then it cleans the dom automatically -->
 
            //'startDateTime' : true, 'endDateTime' : true, 'startDate' : true, 'endDate' : true,
        */
        // link: function(scope, elem, attr) {
//                'venueName-{{$index}}' : false, 'location-{{$index}}': true,
        compile: function(elem) {
            //$timeout(function() {
            var requiredIds = { 'eventName' : true, 'description' : true , 'partnerType' : true, 'partnerName' : true, 'expectedPeak' : true, 
                'category' : true, 'sportsSubcategory' : true, 'accessibility' : true, 'accessibilityNotes' : true, 'parkingCost' : false,
                'frequency' : true, 'startDateTime' : true, 'endDateTime' : false, 'startDate' : true, 'endDate' : true, 'occurStartDateTime-{{$index}}' : true, 'dayOfWeek-{{$index}}': true,
                'locationName-{{vm.locIndex}}' : true, 'location-{{vm.locIndex}}': true,
				'rcStartDate-{{$index}}' : true, 'rcEndDate-{{$index}}' : true,
                'costRange' : true, 'reservationsRequired': true,'freeEvent': true,
				'imageAltText-{{$index}}' : true,'imageCredit-{{$index}}' : false,
                'orgName' : true,'contactName' : true, 'orgAddress' : true, 'orgPhone' : true, 'orgEmail' : true, 'orgType' : true, 'orgTypeOther' : true}
            var inputList = elem[0].querySelectorAll('input, textarea');
            forEach(inputList, function (item, value) {
            
                if (requiredIds.hasOwnProperty(item.name) && requiredIds[item.name] === true) {
                    $(item).attr('required', '');
                    var fn = $compile(item);

                    /* for radio buttons, assume there will be an ID field which id the same as the name on the radio buttons.
                       Also assume the label-for will be for the ID.-- i'mno longer doing this.. doing a input field with display i=none and change-clue event instead
                        <div id="orgType" class="form-control">
                        <div class="horizontal entryField">
                            <input name="orgType" data-ng-model="ec.event.orgType"  title="Organization Type" type="radio" class="form-control" value="Non-Profit" >Non-Profit
                        </div>
                        <div class="horizontal entryField">
                            <input name="orgType" data-ng-model="ec.event.orgType"  title="Organization Type" type="radio" class="form-control" value="Public Agency" >Public Agency
                        </div>
                        <div class="horizontal entryField">
                            <input name="orgType" data-ng-model="ec.event.orgType" title="Organization Type" type="radio" class="form-control" value="Private/Business" >Private/Business
                        </div>
                        <div class="horizontal entryField">
                            <input name="orgType" data-ng-model="ec.event.orgType"  data-ng-click="ec.resetFormValidation()" title="Organization Type" type="radio" class="form-control" value="Other" >Other
                        </div>
                    </div>
                    */
                    if (item.type !== 'radio') {
                        var label = $('label[for="'+$(item).attr('id')+'"]');
                        label.addClass('required');
                        if(label.length <= 0) {
                            $log.debug(item)
                            $log.debug($(item) + " - no 'for-' found "); // passes index + value back!
                        }
                    } else {
                        var label = $('label[for="'+$(item).attr('name')+'"]');
                        label.addClass('required');
                        if(label.length <= 0) {
                        }
                    }
                    return function(scope){
                        fn(scope);
                    };                  
                }
            });
            //})
        }
        ,
  
  };
  };
  
 angular.module('eventCalendarApp').directive('eventform', directive);

}());