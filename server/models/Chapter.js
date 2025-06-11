module.exports = (sequelize, DataTypes) => {
  const Chapter = sequelize.define('Chapter', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    novel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'novels',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
        notEmpty: true
      }
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      defaultValue: ''
    },
    word_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('草稿', '已完结'),
      allowNull: false,
      defaultValue: '草稿'
    },
    is_vip: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    publish_time: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'chapters',
    indexes: [
      {
        fields: ['novel_id']
      },
      {
        fields: ['order_index']
      },
      {
        fields: ['status']
      },
      {
        unique: true,
        fields: ['novel_id', 'order_index']
      }
    ]
  });

  return Chapter;
}; 