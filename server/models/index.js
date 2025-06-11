const { Sequelize } = require('sequelize');

// 数据库配置
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// 导入模型
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Novel = require('./Novel')(sequelize, Sequelize.DataTypes);
const Chapter = require('./Chapter')(sequelize, Sequelize.DataTypes);

// 定义关联关系
User.hasMany(Novel, { foreignKey: 'user_id', as: 'novels' });
Novel.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

Novel.hasMany(Chapter, { foreignKey: 'novel_id', as: 'chapters' });
Chapter.belongsTo(Novel, { foreignKey: 'novel_id', as: 'novel' });

const db = {
  sequelize,
  Sequelize,
  User,
  Novel,
  Chapter
};

module.exports = db; 