/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

// Modulos requeridos.
var promise = require('bluebird');
var fs = require('fs');
var sizeOf = require('image-size');
var imageDataURIModule = require('image-data-uri');
var path = require('path');

module.exports = {
  /**
   *  función para registrar una empresa.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   * @return {Object}
   */
  signup: function(req, res) {
    // Inicialización de variables necesarias. los parametros necesarios viajan en el cuerpo
    // de la solicitud.
    var name = null;
    var nit = null;
    var businessOverview = null;
    var website = null;
    var imageURI = null;
    // variables necesarias para cargar la imagen.
    var imageDataURI = null;
    var tempLocation = null;
    var absolutePath = null;

    var country = null;
    var department = null;
    var city = null;
    var nomenclature = null;
    var phonenumber = null;
    var contact = null;
    var contactPhonenumber = null;

    var email = null;
    var password = null;


    // Definición de variables apartir de los parametros de la solicitud y validaciones.
    name = req.param('name');
    if (!name) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un nombre.'
      });
    }

    nit = req.param('nit').toString();
    if (!nit) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un nit.'
      });
    }

    businessOverview = req.param('businessOverview');
    if (!businessOverview) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar una descripción empresarial.'
      });
    }

    country = req.param('country');
    if (!country) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un país.'
      });
    }

    department = req.param('department');
    if (!department) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un departamento.'
      });
    }

    city = req.param('city');
    if (!city) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar una ciudad.'
      });
    }

    nomenclature = req.param('nomenclature');
    if (!nomenclature) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar una nomenclatura.'
      });
    }

    phonenumber = req.param('phonenumber');
    if (!phonenumber) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un telefono.'
      });
    }

    contact = req.param('contact');
    if (!contact) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un contacto.'
      });
    }

    contactPhonenumber = req.param('contactPhonenumber');
    if (!contactPhonenumber) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un número de teléfono del contacto.'
      });
    }

    email = req.param('email');
    if (!email) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un email.'
      });
    }

    password = req.param('password');
    if (!password) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar una contraseña.'
      });
    }

    website = req.param('website');
    imageDataURI = req.param('imageDataURI');

    var relativePath = "/assets/images/avatars/" + nit + "_1"
    var pathAvatar = sails.config.appPath + relativePath;

    User.findOne({where: {email: email}})
      .then(function(user) {
        if (user) {throw new Error("El usuario ya existe");}
        return Company.findOne({where: {$or: [{nit: nit}, {name: name}]}
        });
      })
      .then(function(company) {
        if (company) {throw new Error("La compañia ya existe");}
        if (imageDataURI) {
          return ImageDataURIService.decodeAndSave(imageDataURI, pathAvatar);
        }
        return null;
      })
      .then(function(resUpload) {
        if (resUpload) {
          absolutePath = resUpload;
          // Se valida que el archivo tenga el formato y la resolución deseada.
          var dimensions = sizeOf(absolutePath);
          if (dimensions.type != "png" && dimensions.type != "jpeg" && dimensions.type != "jpg") {
            fs.unlink(absolutePath, (err) => {
              sails.log.debug('Se borró la imagen');
            });
            throw new Error("La configuración del archivo no es valida");
          }
          imageURI = relativePath + '.' + absolutePath.split('.')[1];
        }

        // Organización de credenciales y cifrado de la contraseña del usuario.
        var userCredentials = createUserCredentials(email, password);

        var companyCredentials = createCompanyCredentials(name, nit, businessOverview, website, imageURI);

        var headquartersCredentials = createHeadquartersCredentials(country, department, city, nomenclature, phonenumber, contact, contactPhonenumber);

        // Se verifica que el usuario no exista antes de su creación, en caso de que exista
        // se retorna un error de conflicto con codigo de error 409. En caso de que no exista
        // se crea el regitro del usuario.
        return sequelize.transaction(function(t) {
          return User.create(userCredentials, {transaction: t})
            .then(function(user) {
              return user.setCompany(Company.build(companyCredentials), {transaction: t});
            })
            .then(function(company) {
              headquartersCredentials.companyId = company.id;
              return Headquarters.create(headquartersCredentials, {transaction: t});
            })
        }).then(function(result) {
          // Transaction has been committed
          MailService.sendMailSignup(email, name);
          res.ok(result);
        })
      })
      .catch(function(err) {
        if (absolutePath) {
          fs.unlink(absolutePath, (err) => {
            if (err) throw err;
            sails.log.debug('Se borró la imagen');
          });
        }
        // Transaction has been rolled back
        res.serverError(err);
      })
  },
  /**
   * Función para obtener el perfil de una empresa.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   * @return {Object}
   */
  getProfile: function(req, res) {
    // Declaración de variables.
    var user = null;
    var company = {};

    // Definición de variables y validaciones.
    user = req.user;

    Company.findOne({
        include: [{
          model: Headquarters,
          where: {
            main: true
          }
        }, {
          model: User,
          where: {
            id: user.id
          }
        }]
      })
      .then(function(companyQuery) {
        company = companyQuery;
        if (company.imageURI) {
          sails.log.debug(path.resolve(sails.config.appPath + company.imageURI));
          return ImageDataURIService.encode(path.resolve(sails.config.appPath + company.imageURI));
        } else {
          return null;
        }
      })
      .then((imageDataURI) => {
        if (imageDataURI) {
          company.imageURI = imageDataURI;
        }
        company.nit = parseInt(company.nit);
        company.Headquarters[0].contactPhonenumber = parseInt(company.Headquarters[0].contactPhonenumber);
        res.ok(company);
      })
      .catch(function(err) {
        sails.log.debug(err);
        res.serverError(err);
      })
  },
  /**
   * Función para actulizar los datos de una empresa.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   * @return {Object}
   */
  updateData: function(req, res) {
    // Inicialización de variables necesarias. los parametros necesarios viajan en el cuerpo
    // de la solicitud.
    var name = null;
    var nit = null;
    var businessOverview = null;
    var website = null;

    var country = null;
    var department = null;
    var city = null;
    var nomenclature = null;
    var phonenumber = null;
    var contact = null;
    var contactPhonenumber = null;
    var email = null;
    var user = null;

    // Definición de variables apartir de los parametros de la solicitud y validaciones.
    name = req.param('name');
    if (!name) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un nombre.'
      });
    }

    nit = req.param('nit');
    if (!nit) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un nit.'
      });
    }

    businessOverview = req.param('businessOverview');
    if (!businessOverview) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar una descripción empresarial.'
      });
    }

    country = req.param('country');
    if (!country) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un país.'
      });
    }

    department = req.param('department');
    if (!department) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un departamento.'
      });
    }

    city = req.param('city');
    if (!city) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar una ciudad.'
      });
    }

    nomenclature = req.param('nomenclature');
    if (!nomenclature) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar una nomenclatura.'
      });
    }

    phonenumber = req.param('phonenumber');
    if (!phonenumber) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un telefono.'
      });
    }

    contact = req.param('contact');
    if (!contact) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un contacto.'
      });
    }

    contactPhonenumber = req.param('contactPhonenumber');
    if (!contactPhonenumber) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un número de teléfono del contacto.'
      });
    }

    email = req.param('email');
    if (!email) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar un email.'
      });
    }

    website = req.param('website');
    user = req.user;
    // Organización de credenciales.

    var companyCredentials = createCompanyCredentials(name, nit, businessOverview, website, null);

    var headquartersCredentials = createHeadquartersCredentials(country, department, city, nomenclature, phonenumber, contact, contactPhonenumber);

    // Se verifica que el usuario exista y este activo antes de su actualización, en caso de que no exista
    // se retorna un error de conflicto con codigo de error 409. En caso de que exista
    // se actualiza el regitro del usuario.
    return sequelize.transaction(function(t) {
      return User.findOne({
          where: {
            id: user.id,
            state: true
          }
        }, {
          transaction: t
        })
        .then(function(user) {
          if (user) {
            User.update({
              email: email
            }, {
              where: {
                id: user.id
              },
              transaction: t
            });
            return Company.findOne({
              where: {
                userId: user.id
              }
            })
          } else {
            throw "El usuario no existe o está desactivado";
          }
        })
        .then(function(company) {
          company.update(companyCredentials, {
            transaction: t
          });
          return Headquarters.update(headquartersCredentials, {
            where: {
              companyId: company.id
            },
            transaction: t
          });
        })
    }).spread(function(affectedCount, affectedRows) {
      // Transaction has been committed
      res.ok(affectedRows);
    }).catch(function(err) {
      // Transaction has been rolled back
      res.serverError(err);
    });

  },
  /**
   * Función para actualizar la imagen de perfil de un usuario.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  updateImageProfile: function(req, res) {
    // Se declara las variables necesarias para actualizar la imagen de perfil de un cliente
    var user = null;
    var imageURI = null;
    var imageURIDB = null;
    // variables necesarias para cargar la imagen.
    var imageDataURI = null;
    // var tempLocation = null;

    // Definición de las variables.
    imageDataURI = req.param('imageDataURI');
    if (!imageDataURI) {
      return res.badRequest("DataURI de la imagen vacío.")
    }
    user = req.user;

    var relativePath = null;

    Company.findOne({
        where: {
          userId: user.id
        }
      })
      .then(function(company) {
        sails.log.debug(company);
        var newNameImage = null;
        if (company.imageURI) {
          imageURIDB = sails.config.appPath + company.imageURI;
          var arrayImageURIDB = imageURIDB.split("/");
          var fileNameDB = arrayImageURIDB[arrayImageURIDB.length - 1];
          var imageNameDB = fileNameDB.split(".")[0];
          var numNewImage = parseInt(imageNameDB.substring(imageNameDB.length - 1)) + 1;
        }
        newNameImage = company.imageURI ? company.nit + "_" + numNewImage : company.nit + "_1";
        relativePath = "/assets/images/avatars/" + newNameImage;
        var pathAvatars = sails.config.appPath + relativePath;
        return Promise.all = [company, ImageDataURIService.decodeAndSave(imageDataURI, pathAvatars)]

      })
      .spread((company, resUpload) => {
        if (resUpload) {
          imageURI = resUpload;
          // Se valida que el archivo tenga el formato y la resolución deseada.
          var dimensions = sizeOf(imageURI);
          if (dimensions.type != "png" && dimensions.type != "jpeg" && dimensions.type != "jpg") {
            fs.unlink(imageURI, (err) => {
              sails.log.debug('Se borró la imagen');
            });
            throw new Error("La configuración del archivo no es valida");
          }
        }
        return company.update({
          imageURI: relativePath + '.' + imageURI.split('.')[1],
        })
      })
      .then(function(AmountRowsAffected) {
        if (imageURIDB) {
          fs.unlink(imageURIDB, (err) => {
            if (err) throw err;
            sails.log.debug('Se borró la imagen vieja');
          });
        }
        res.ok(imageURI);
      })
      .catch(function(err) {
        fs.unlink(imageURI, (err) => {
          if (err) throw err;
          sails.log.debug('Se borró la imagen nueva');
        });
        res.serverError(err);
      })
  },
  /**
   * Función para actualizar la contraseña de un usuario.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  updatePassword: function(req, res) {
    // Se declara las variables necesarias para actualizar la contraseña de un cliente
    var user = req.user;
    var currentPassword = req.param('currentPassword');
    var newPassword = req.param('newPassword');

    // valida si existe el cliente con el id, si existe cambia la contraseña de su usuario en false
    User.findOne({
        where: {
          id: user.id
        }
      })
      .then(function(user) {
        if (CriptoService.compararHash(currentPassword, user.password)) {
          newPassword = CriptoService.hashValor(newPassword);
          return user.update({
            password: newPassword
          });
        } else {
          throw 'Error con contraseña actual';
        }
      })
      .then(function(user) {
        return res.ok();
      })
      .catch(function(err) {
        sails.log.debug(err);
        res.serverError();
      });
  },
  /**
   * Función para desactivar la cuenta de un usuario.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  deactivateAccount: function(req, res) {
    // Declaración de variables
    var user = null;
    user = req.user;

    // Se valida que el usuario exista, en caso de que exita se cambia el estado a false.
    User.findOne({
        where: {
          id: user.id
        }
      })
      .then(function(user) {
        if (user) {
          return user.update({
            state: false
          })
        }
        throw "El usuario no existe";
      })
      .then(function(countUserUpdated) {
        res.ok();
      })
      .catch(function(err) {
        res.serverError();
      })
  },
  /**
   * Función para seguir a una empresa registrada.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  followCompany: function(req, res) {
    // Declaración de variables
    var user = null;
    var supplierId = null;

    // Definición de variables y validaciones.
    var supplierId = req.param("supplierId");
    if (!supplierId) {
      res.badRequest("El id del proveedor es vacio");
    }

    user = req.user;
    sails.log.debug(user.id);
    Company.findAll({
        include: [User],
        where: {
          id: supplierId
        }
      })
      .then(function(supplier) {
        if (supplier[0] && supplier[0].User.state) {
          return supplier[0].addClients(user.id)
        }
        throw "La empresa no existe"
      })
      .then(function(clientSupplier) {
        sails.log.debug(clientSupplier)
        res.ok(clientSupplier[0][0]);
      })
      .catch(function(err) {
        res.serverError(err);
      })
  },
  /**
   * Función para buscar a una empresa por su nombre.
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

    Company.findAll({
        include: [{
          model: Headquarters,
          where: {
            main: true
          }
        }, {
          model: User,
          attributes: {
            exclude: ['password']
          }
        }],
        where: {
          name: {
            $iLike: '%' + name + '%'
          }
        }
      })
      .then(function(companies) {
        var numberCompanies = companies.length;
        companies.forEach(function(company, index, companiesList) {
          company.dataValues.type = 1;
          ImageDataURIService.encode(path.resolve(sails.config.appPath + company.imageURI))
            .then((imageDataURI) => {
              company.imageURI = imageDataURI;
            })
            .catch((err) => {
              sails.log.debug(err)
            })
        })
        setTimeout(function() {
          res.ok(companies);
        }, 15);

      })
      .catch(function(err) {
        sails.log.debug(err);
        res.serverError(err);
      })
  },
  /**
   * Función para buscar empresa o producto por palabra o frase clave de su nombre o descripción.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  searchAll: function(req, res) {
    // Declaración de variables.
    var keyword = null;
    var result = {};
    var products = [];

    // Definición de variables y validaciones.
    keyword = req.param('keyword');
    if (!keyword) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar alguna palabra.'
      });
    }

    Product.findAll({
        where: {
          $or: [{
            name: {
              $iLike: '%' + keyword + '%'
            }
          }, {
            description: {
              $iLike: '%' + keyword + '%'
            }
          }]
        },
        include: [{
          model: ElementData,
          include: [{
            model: Element,
          }]
        }, {
          model: Company,
          attributes: ['name', 'id']
        }]
      })
      .then(function(productsQuery) {
        products = productsQuery;
        products.forEach(function(product, index, productsList) {
          product.dataValues.type = 2;
          ImageDataURIService.encode(path.resolve(sails.config.appPath + product.imageURI))
            .then((imageDataURI) => {
              product.imageURI = imageDataURI;
            })
            .catch((err) => {
              sails.log.debug(err)
            })
        })
        return Company.findAll({
          include: [{
            model: Headquarters,
            where: {
              main: true
            }
          }, {
            model: User,
            attributes: {
              exclude: ['password']
            }
          }],
          where: {
            $or: [{
              name: {
                $iLike: '%' + keyword + '%'
              }
            }, {
              businessOverview: {
                $iLike: '%' + keyword + '%'
              }
            }]
          }
        })
      })
      .then(function(companies) {
        companies.forEach(function(company, index, companiesList) {
          company.dataValues.type = 1;
          ImageDataURIService.encode(path.resolve(sails.config.appPath + company.imageURI))
            .then((imageDataURI) => {
              company.imageURI = imageDataURI;
            })
            .catch((err) => {
              sails.log.debug(err)
            })
        })
        setTimeout(function() {
          result.products = products;
          result.companies = companies;
          res.ok(result);
        }, 10);
      })
      .catch(function(err) {
        sails.log.debug(err);
        res.serverError(err);
      })
  },
  /**
   * Función para obtener los clientes de una empresa.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  getClients: function(req, res) {
    // Declaración de variables.
    var user = null;

    user = req.user;

    Company.findOne({
        where: {
          userId: user.id
        }
      })
      .then(function(company) {
        return company.getClients({
          include: [{
            model: Headquarters,
          }, {
            model: User,
            attributes: {
              exclude: ['password']
            }
          }]
        })
      })
      .then(function(clients) {
        clients.forEach(function(client, index, clientsList) {
          ImageDataURIService.encode(sails.config.appPath + client.imageURI)
            .then((imageDataURI) => {
              client.imageURI = imageDataURI;
            })
            .catch((err) => {
              sails.log.debug(err)
            })
        })
        setTimeout(function() {
          res.ok(clients);
        }, 15);
      })
      .catch(function(err) {
        res.serverError(err);
      })
  },
  /**
   * Función para obtener los proveedores de una empresa.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  getSuppliers: function(req, res) {
    // Declaración de variables.
    var user = null;

    user = req.user;

    Company.findOne({
        where: {
          userId: user.id
        }
      })
      .then(function(company) {
        return company.getSuppliers({
          include: [{
            model: Headquarters,
            where: {
              main: true
            }
          }, {
            model: User,
            attributes: {
              exclude: ['password']
            }
          }]
        })
      })
      .then(function(suppliers) {
        suppliers.forEach(function(supplier, index, suppliersList) {
          ImageDataURIService.encode(sails.config.appPath + supplier.imageURI)
            .then((imageDataURI) => {
              supplier.imageURI = imageDataURI;
            })
            .catch((err) => {
              sails.log.debug(err)
            })
        })
        setTimeout(function() {
          res.ok(suppliers);
        }, 15);
      })
      .catch(function(err) {
        res.serverError(err);
      })
  },
  /**
   * Función para asignar un descuento a un elemento para un cliente.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  setDiscountToClient: function(req, res) {
    // Declaración de variables.
    var user = null;
    var clientId = null;
    var elementDataId = null;
    var discount = null;

    // Definición de variables y validaciones;
    clientId = parseInt(req.param('clientId'));
    if (!clientId) {
      return res.badRequest('Id del cliente vacío');
    }

    elementDataId = parseInt(req.param('elementDataId'));
    if (!elementDataId) {
      return res.badRequest('Id del elemento vacío')
    }

    discount = parseInt(req.param('discount'));
    if (!discount) {
      return res.badRequest('Descuento vacío')
    }

    user = req.user;

    // Se verifica que la empresa con clientId en verdad sea un cliente.
    ClientSupplier.findOne({
        where: {
          supplierId: user.id,
          clientId: clientId
        }
      })
      .then(function(clientSupplier) {
        if (clientSupplier) {
          return Promise.all = [clientSupplier, ElementData.findOne({
            where: {
              id: elementDataId,
              userId: user.id
            }
          })];
        }
        throw "No es cliente";
      })
      .spread(function(clientSupplier, elementData) {
        if (elementData) {
          elementData.ClientDiscount = {
            discount: discount
          }
          return clientSupplier.addElementData(elementData);
        }
        throw "El elemento no existe o no es del proveedor";
      })
      .then(function(clientDiscount) {
        res.ok(clientDiscount[0]);
      })
      .catch(function(err) {
        res.serverError(err);
      })

  },
  /**
   * Función para modificar un descuento a un elemento para un cliente.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  updateDiscountToClient: function(req, res) {
    // Declaración de variables.
    var clientDiscountId = null;
    var newDiscount = null;

    // Definición de variables y validaciones;
    clientDiscountId = parseInt(req.param('clientDiscountId'));
    if (!clientDiscountId) {
      return res.badRequest('Id del descuento para el cliente vacío');
    }

    newDiscount = parseInt(req.param('newDiscount'));
    if (!newDiscount) {
      return res.badRequest('Descuento vacío')
    }

    // Se verifica que el descuento con id clientDiscountId para el cliente exista.
    ClientDiscount.findById(clientDiscountId)
      .then(function(clientDiscount) {
        if (clientDiscount) {
          return clientDiscount.update({
            discount: newDiscount
          });
        }
        throw "El cliente no tiene asignado un descuento con ese id";
      })
      .then(function(clientDiscount) {
        res.ok(clientDiscount);
      })
      .catch(function(err) {
        res.serverError(err);
      })
  },
  /**
   * Función para eliminar un descuento a un elemento para un cliente.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   */
  deleteDiscountToClient: function(req, res) {
    // Declaración de variables.
    var clientDiscountId = null;

    // Definición de variables y validaciones;
    clientDiscountId = parseInt(req.param('clientDiscountId'));
    if (!clientDiscountId) {
      return res.badRequest('Id del descuento para el cliente vacío');
    }

    // Se verifica que el descuento con id clientDiscountId para el cliente exista.
    ClientDiscount.findById(clientDiscountId)
      .then(function(clientDiscount) {
        if (clientDiscount) {
          return clientDiscount.destroy();
        }
        throw "El cliente no tiene asignado un descuento con ese id";
      })
      .then(function() {
        res.ok();
      })
      .catch(function(err) {
        res.serverError(err);
      })
  },

  /**
   * Funcion para recuperar la contraseña de una empresa.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   * @return
   */
  requestTokenRecovery: function(req, res) {
    var email = req.param('email');
    var code = null;
    var token = null;
    if (!email) {
      return res.badRequest('Correo requerido');
    }

    User.findOne({
        where: {
          email: email
        }
      })
      .then(function(user) {
        if (!user) {
          return res.badRequest();
        }
        code = CriptoService.generateString(15);
        token = CriptoService.createTokenRecovery({
          email: email,
          code: code
        });
        MailService.sendMailCode(user, code);
        return res.json(token);
      })
      .catch((err) => {
        res.serverError(err)
      });
  },

  /**
   * Funcion para recuperar la contraseña de una empresa.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   * @return
   */
  recoverPassword: function(req, res) {
    var user = null;
    var email = null;;
    var codeToken = null;
    var code = null;

    user = req.user;
    if (!user) {
      return serverError("Error");
    }

    email = user.email
    codeToken = user.code;
    code = req.param('code');

    if (!email | !codeToken | !code) {
      return res.serverError("Error");
    }

    if (code !== codeToken) {
      return res.badRequest("El codigo ingresado no es invalido.");
    }

    var newPassword = CriptoService.generateString(20);
    var passwordEncrypted = CriptoService.hashValor(newPassword);

    User.update({
        password: passwordEncrypted
      }, {
        where: {
          email: email
        }
      })
      .then(function(user) {
        MailService.sendMailPassword(email, newPassword);
        res.ok();
      })
      .catch(function(err) {
        res.serverError(err);
      });
  },
  /**
   * Funcion para validar si una empresa es proveedor.
   * @param  {Object} req Request object
   * @param  {Object} res Response object
   * @return
   */
  validateSupplier: function(req, res) {
    //Declaración de variables.
    var user = null;
    var companyId = null;

    // Definición de variables y validaciones.
    companyId = parseInt(req.param('companyId'));
    if (!companyId) {
      return res.badRequest({
        code: 1,
        msg: 'Se debe ingresar el id de una empresa.'
      });
    }

    user = req.user;

    Company.findOne({
        where: {
          id: companyId
        }
      })
      .then((supplier) => {
        if (!supplier) {
          throw new Error("La empresa no existe");
        }
        return Company.findOne({
          where: {
            userId: user.id
          }
        });
      })
      .then((client) => {
        return client.hasSupplier(companyId);
      })
      .then((isSupplier) => {
        res.ok(isSupplier)
      })
      .catch((err) => {
        sails.log.debug(err)
      })
  },
};

// crea las credenciales para insertar un usuario
function createUserCredentials(email, password) {
  password = CriptoService.hashValor(password);
  var userCredentials = {
    email: email,
    password: password,
    state: true
  };
  return userCredentials;
};

// crea las credenciales para insertar una empresa
function createCompanyCredentials(name, nit, businessOverview, website, imageURI) {
  var companyCredentials = {
    name: name,
    nit: nit,
    businessOverview: businessOverview,
    website: website
  };
  if (imageURI) {
    companyCredentials.imageURI = imageURI;
  }
  return companyCredentials;
}

// Crea las credenciales para insertar una sede.
function createHeadquartersCredentials(country, department, city, nomenclature, phonenumber,
  contact, contactPhonenumber) {
  var headquartersCredentials = {
    country: country,
    department: department,
    city: city,
    nomenclature: nomenclature,
    phonenumber: phonenumber,
    contact: contact,
    contactPhonenumber: contactPhonenumber,
    main: true
  };
  return headquartersCredentials;
}
