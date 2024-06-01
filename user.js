const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            email: { // 이메일 필드 추가
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true
            },
            inquiry: { // 문의 내용 필드 추가
                type: Sequelize.TEXT,
                allowNull: true
            }
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'User',
            tableName: 'user',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.User.hasMany(db.Comment, { sourceKey: 'email', onDelete: 'cascade' });
    }
};
