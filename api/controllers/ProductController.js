/**
 * ProductController
 *
 * @description :: Server-side logic for managing products
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

// Modulos requeridos.
var promise = require('bluebird');
var fs = require('fs');
var sizeOf = require('image-size');

module.exports = {
  /**
   * Función para crear un producto o servicio.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  create: function(req, res) {
    // Declaración de variables.
    var code = null;
    var name = null;
    var description = null;
    var elements = [];
    var price = null;
    var stateId = null;
    var user = null;
    var addedElements = [];
    var imageURI = null;
    // variables necesarias para cargar la imagen.
    var imageFile = null;
    // var tempLocation = null;

    var productCredentials = null;

    // Definición de las variables y validaciones.
    elements = req.param("elements");
    if (typeof elements == 'string') {
      return res.badRequest({
        code: 1,
        msg: 'There are no enough elements'
      });
    } else {
      elements.forEach(function(element, i, elementsList) {
        element = JSON.parse(element)
        elementsList[i] = element;
        index = addedElements.indexOf(elementsList[i].name.toUpperCase().trim());
        if (index != -1) {
          return res.badRequest({
            code: 2,
            msg: 'There are repeated elements.'
          })
        } else {
          addedElements.push(elementsList[i].name.toUpperCase().trim());
        }
      })
    }

    code = req.param('code');
    if (!code) {
      return res.badRequest('Códio del producto vacío');
    }

    name = req.param('name');
    if (!name) {
      return res.badRequest('Nombre del producto vacío');
    }

    description = req.param('description');
    if (!description) {
      return res.badRequest('Descripción del producto vacío');
    }

    price = req.param('price');
    if (!price) {
      return res.badRequest('Precio del producto vacío');
    }

    stateId = parseInt(req.param('stateId'));
    if (!stateId) {
      return res.badRequest('Id del estado vacío');
    }

    //  user = req.user;
    user = {
      id: 1
    }
    imageFile = req.file('imageFile');

    var pathAvatars = sails.config.appPath + "/assets/images/products/";
    // var tmpPathAvatars = sails.config.appPath + '/.tmp/public/images/uploads/';

    // Cargar la imagen en el directorio images/avatars
    imageFile.upload({
      dirname: pathAvatars
    }, function onUploadComplete(err, uploadedImage) {
      if (err) return res.serverError(err);
      imageURI = uploadedImage[0].fd;

      //Copy the file to the temp folder so that it becomes available immediately
      // fs.createReadStream(imageURI).pipe(fs.createWriteStream(tempLocation));

      // Se valida que el archivo tenga el formato y la resolución deseada.
      var dimensions = sizeOf(imageURI);
      sails.log.debug(dimensions);
      if (dimensions.width > 800 || dimensions.height > 800 || (dimensions.type != "png" && dimensions.type != "jpeg" && dimensions.type != "jpg")) {
        fs.unlink(imageURI, (err) => {
          if (err) throw err;
          sails.log.debug('Se borró la imagen');
        });
        return res.badRequest("La configuración del archivo no es valida");
      }

      return sequelize.transaction(function(t) {
          return Company.findAll({
              where: {
                userId: user.id
              },
              transaction: t
            })
            .then(function(company) {
              // sails.log.debug(company[0]);
              return Promise.all = [company[0], company[0].getProducts({
                where: {
                  code: code
                },
                transaction: t
              })];
            })
            .spread(function(company, products) {
              if (products.length == 0) {
                // Creación de las credenciales para crear un producto.
                productCredentials = {
                  code: code,
                  name: name,
                  description: description,
                  price: price,
                  stateId: stateId,
                  imageURI: imageURI,
                  companyId: company.id
                }
                return Product.create(productCredentials, {
                  transaction: t
                });
              }
              throw "Ya existe un producto con ese código";
            })
            .then(function(newProduct) {
              if (elements.length >= 3) {
                elements.forEach(function(element, i, elementsList) {
                  var elementProduct = {
                    elementId: element.id,
                    productId: newProduct.id,
                    main: element.main,
                  }
                  elements[i] = elementProduct;
                })
                return ElementProduct.bulkCreate(elements, {
                  transaction: t
                })
              } else {
                throw "No hay elementos";
              }
            })
        })
        .then(function(result) {
          res.ok(result);
        })
        .catch(function(err) {
          fs.unlink(imageURI, (err) => {
            if (err) throw err;
            sails.log.debug('Se borró la imagen');
          });
          sails.log.debug(err);
        })

    });


  },
  /**
   * Función para editar un producto o servicio.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  edit: function(req, res) {
    // Declaración de variables.
    var code = null;
    var name = null;
    var description = null;
    var elements = [];
    var price = null;
    var stateId = null;
    var productId = null;
    var user = null;
    var addedElements = [];
    var elementsToSet = [];
    var mainElement = null;
    var productCredentials = null;

    // Definición de las variables y validaciones.
    elements = req.param("elements");
    if (typeof elements == 'string') {
      return res.badRequest({
        code: 1,
        msg: 'There are no enough elements'
      });
    } else {
      elements.forEach(function(element, i, elementsList) {
        element = JSON.parse(element)
        elementsList[i] = element;
        index = addedElements.indexOf(elementsList[i].name.toUpperCase().trim());
        if (index != -1) {
          return res.badRequest({
            code: 2,
            msg: 'There are repeated elements.'
          })
        } else {
          addedElements.push(elementsList[i].name.toUpperCase().trim());
        }
      })
    }

    code = req.param('code');
    if (!code) {
      return res.badRequest('Códio del producto vacío');
    }

    name = req.param('name');
    if (!name) {
      return res.badRequest('Nombre del producto vacío');
    }

    description = req.param('description');
    if (!description) {
      return res.badRequest('Descripción del producto vacío');
    }

    price = req.param('price');
    if (!price) {
      return res.badRequest('Precio del producto vacío');
    }

    stateId = parseInt(req.param('stateId'));
    if (!stateId) {
      return res.badRequest('Id del estado vacío');
    }

    productId = parseInt(req.param('productId'));
    if (!productId) {
      return res.badRequest('Id del producto vacío');
    }

    //  user = req.user;
    user = {
      id: 1
    }

    return sequelize.transaction(function(t) {
        return Company.findAll({
            where: {
              userId: user.id
            },
            transaction: t
          })
          .then(function(company) {
            return company[0].getProducts({
              where: {
                code: code
              },
              transaction: t
            });
          })
          .then(function(products) {
            if (products.length == 0 || products[0].id == productId) {
              // Creación de las credenciales para crear un producto.
              productCredentials = {
                code: code,
                name: name,
                description: description,
                price: price,
                stateId: stateId,
                imageURI: "falsdf.com",
              }
              return Promise.all = [Product.findById(productId), Product.update(productCredentials, {
                where: {
                  id: productId
                },
                transaction: t
              })];
            }
            throw "Ya existe un producto con ese código";
          })
          .spread(function(product, amountProductsUpdated) {
            sails.log.debug(elements);
            if (elements.length >= 3) {
              elements.forEach(function(element, i, elementsList) {
                if (element.main == 'true') {
                  mainElement = element.id;
                } else {
                  elementsToSet.push(element.id);
                }
              })
              return Promise.all = [product, ElementData.findById(mainElement, {
                transaction: t
              })];
            } else {
              throw "No hay elementos";
            }
          })
          .spread(function(product, element) {
            element.ElementProduct = {
              main: true
            }
            elementsToSet.push(element);
            return product.setElementData(elementsToSet, {
              transaction: t
            })

          })
      })
      .then(function(result) {
        sails.log.debug(result[1]);
        res.ok(result[1]);
      })
      .catch(function(err) {
        sails.log.debug(err);
      })
  },
  /**
   * Función para eliminar un producto o servicio.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  delete: function(req, res) {
    // Declaración de variables.
    var productId = null;

    // Definición de las variables y validaciones.
    productId = parseInt(req.param('productId'));
    if (!productId) {
      return res.badRequest('Id del producto vacío');
    }

    // Se verifica que el producto exista, en caso de que exista se actualiza el campo enabled a false.
    Product.findById(productId)
      .then(function(product) {
        if (product) {
          return product.update({
            enabled: false
          })
        }
        throw "El producto no existe";
      })
      .then(function() {
        res.ok()
      })
      .catch(function(err) {
        res.serverError(err);
      })
  },
  /**
   * Función para obtener los productos o servicios de un usuario atenticado.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  getMyProducts: function(req, res) {
    // Declaración de variables.
    var user = null;

    // Definición de variables.
    // user = req.user;
    user = {
      id: 1
    }

    Company.findAll({
        include: [{
          model: Product,
          include: [{
            model: ElementData,
            include: [{
              model: Element,
            }]
          }]
        }],
        where: {
          userId: user.id
        }
      })
      .then(function(company) {
        sails.log.debug(company[0]);
        res.ok(company[0]);
      })
      .catch(function(err) {
        res.serverError(err);
      })
  },
  /**
   * Función para obtener los productos o servicios por nombre.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  getByName: function(req, res) {
    // Declaración de variables.
    var name = null;

    // Definición de variables y validaciones.
    name = req.param('name');
    if (!name) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un nombre.'
      });
    }

    Product.findAll({
        where: {
          name: {
            $iLike: '%' + name + '%'
          }
        },
        include: [{
          model: ElementData,
          include: [{
            model: Element,
          }]
        }, {
          model: Company,
          attributes: ['name']
        }]
      })
      .then(function(products) {
        var numberProducts = products.length;
        products.forEach(function(product, index, productsList) {
          product.dataValues.type= 2;
          ImageDataURIService.encode(product.imageURI)
            .then((imageDataURI) => {
              product.imageURI = imageDataURI;
            })
            .catch((err) => {
              sails.log.debug(err)
            })
        })
        setTimeout(function() {
          // sails.log.debug(products);
          res.ok(products);
        }, 10);
      })
      .catch(function(err) {
        sails.log.debug(err);
        res.serverError(err);
      })
  },
  /**
   * Función para obtener los productos o servicios de una empresa.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  getByCompany: function(req, res) {
    // Declaración de variables.
    var companyId = null;

    // Definición de variables y validaciones.
    companyId = parseInt(req.param('companyId'));
    if (!companyId) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar el id de una empresa.'
      });
    }

    Company.findAll({
        include: [{
          model: Product,
          include: [{
            model: ElementData,
            include: [{
              model: Element,
            }]
          }]
        }],
        where: {
          id: companyId
        }
      })
      .then(function(company) {
        sails.log.debug(company[0]);
        res.ok(company[0]);
      })
      .catch(function(err) {
        res.serverError(err);
      })
  },

};