var arketops = angular.module('arketops');
arketops.controller('ClientDataCtrl', ['$scope', '$log', '$state', '$stateParams',
  '$ngConfirm', 'CompanySvc', 'StorageSvc',
  function($scope, $log, $state, $stateParams, $ngConfirm, CompanySvc, StorageSvc) {
    // Declaration of variables
    $scope.client = JSON.parse(StorageSvc.get('clientSelected', 'session'));
    console.log($scope.client);

    $scope.otherHeadquarters = [];
    $scope.client.Headquarters.forEach((headquarters, index, headquartersList) => {
      if (headquarters.main) {
        $scope.mainHeadquarters = headquarters;
      } else {
        $scope.otherHeadquarters.push(headquarters);
      }
    })
  }
]);
