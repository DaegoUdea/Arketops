/**
 * Quotation.js
 *
 * @description :: Modelo que representa la tabla quotation de la base de datos.
 * @autors      :: Jonnatan Rios Vasquez- jrios328@gmail.com    Diego Alvarez-daegoudea@gmail.com
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  // Campos de la tabla con sus atributos.
  attributes: {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      unique: true
    },
    code: {
      type: Sequelize.STRING(32),
      allowNull: false,
      unique: true
    },
    date: {
      type: Sequelize.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      }
    },
    fileURI: {
      type: Sequelize.STRING(512),
      allowNull: false,
      validate: {
        isUrl: true,
      }
    },
    state: {
      type: Sequelize.STRING(32),
      allowNull: false,
    },
  },
  // Describe las asociones que tiene con los demás modelos.
  associations: function () {
    // Asociación uno a muchos con el modelo ClientSupplier.
    Quotation.belongsTo(ClientSupplier, {
      foreignKey: {
        name: 'clientSupplierId',
        allowNull: false
      }
    })
  },
  // Configuraciones y metodos del modelo.
  options: {
    tableName: 'quotation',
    timestamps: false,
    classMethods: {},
    instanceMethods: {},
    hooks: {}
  },
};
