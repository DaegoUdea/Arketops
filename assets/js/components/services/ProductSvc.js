angular.module('arketops')
  .factory('ProductSvc', ['$http',
    function($http) {
      return {
        // Servicio para obtener productos dado su nombre.
        getByName: function (params) {
          var products = $http({
            url: '/product/getByName',
            method: 'GET',
            params: params
          });
          return products;
        }

      };
    }
  ]);