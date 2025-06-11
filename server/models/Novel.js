module.exports = (sequelize, DataTypes) => {
  const Novel = sequelize.define('Novel', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    cover_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '其他'
    },
    status: {
      type: DataTypes.ENUM('连载中', '已完结', '暂停更新'),
      allowNull: false,
      defaultValue: '连载中'
    },
    total_words: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    total_chapters: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'novels',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['last_updated']
      }
    ]
  });

  return Novel;
}; 