/**
 * Headquarters.js
 *
 * @description :: Modelo que representa la tabla headquarters de la base de datos.
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
    country: {
      type: Sequelize.STRING(64),
      allowNull: false,
    },
    department: {
      type: Sequelize.STRING(64),
      allowNull: false,
    },
    city: {
      type: Sequelize.STRING(64),
      allowNull: false,
    },
    nomenclature: {
      type: Sequelize.STRING(64),
      allowNull: false
    },
    phonenumber: {
      type: Sequelize.STRING(32),
      allowNull: false
    },
    contact: {
      type: Sequelize.STRING(256),
      allowNull: false
    },
    contactPhonenumber: {
      type: Sequelize.STRING(32),
      allowNull: true
    },
    main: {
      type: Sequelize.BOOLEAN,
      allowNull: false
    },
  },
  // Describe las asociones que tiene con los demás modelos.
  associations: function() {
    // Asociación uno a muchos con el modelo Company.
    Headquarters.belongsTo(Company, {
      foreignKey: {
        name: 'companyId',
        allowNull: false
      }
    });
  },
  // Configuraciones y metodos del modelo.
  options: {
    tableName: 'headquarters',
    timestamps: false,
    classMethods: {},
    instanceMethods: {},
    hooks: {}
  },
};
