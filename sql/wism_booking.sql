/*
 Navicat Premium Data Transfer

 Source Server         : wwonders
 Source Server Type    : MySQL
 Source Server Version : 50718
 Source Host           : sh-cdb-jm41o87g.sql.tencentcdb.com:59991
 Source Schema         : wism_booking

 Target Server Type    : MySQL
 Target Server Version : 50718
 File Encoding         : 65001

 Date: 29/06/2021 13:43:42
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for hot_desking_booking
-- ----------------------------
DROP TABLE IF EXISTS `hot_desking_booking`;
CREATE TABLE `hot_desking_booking`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `building_id` int(11) NOT NULL,
  `floor_id` int(11) NOT NULL,
  `area_id` int(11) NULL DEFAULT NULL,
  `space_id` int(11) NOT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1.已预定 2.使用中 3.已取消 4.已注销',
  `type` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1.时段预约 2.全天预约 3.立即使用',
  `type2` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1.本人 2.他人',
  `start_time` datetime NOT NULL COMMENT '预定开始时间',
  `end_time` datetime NOT NULL COMMENT '预定结束时间',
  `use_start_time` datetime NULL DEFAULT NULL COMMENT '开始使用时间',
  `use_end_time` datetime NULL DEFAULT NULL COMMENT '结束使用时间',
  `real_end_time` datetime NULL DEFAULT NULL COMMENT '实际结束时间',
  `user_id` int(11) NOT NULL COMMENT '预约人',
  `user2_id` int(11) NULL DEFAULT NULL COMMENT '使用人',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_hot_desking_booking_2`(`user_id`) USING BTREE,
  INDEX `index_hot_desking_booking_1`(`space_id`, `building_id`, `state`, `start_time`) USING BTREE,
  INDEX `index_hot_desking_booking_0`(`building_id`, `floor_id`, `start_time`) USING BTREE,
  INDEX `index_hot_desking_booking_3`(`building_id`, `floor_id`, `space_id`, `start_time`) USING BTREE,
  INDEX `index_hot_desking_booking_4`(`start_time`) USING BTREE,
  INDEX `index_hot_desking_booking_5`(`end_time`) USING BTREE,
  INDEX `index_hot_desking_booking_6`(`building_id`) USING BTREE,
  INDEX `index_hot_desking_booking_7`(`floor_id`) USING BTREE,
  INDEX `index_hot_desking_booking_8`(`area_id`) USING BTREE,
  INDEX `index_hot_desking_booking_9`(`use_end_time`) USING BTREE,
  INDEX `index_hot_desking_booking_10`(`user_id`, `type`, `type2`, `update_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2901529 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for hot_desking_checkin
-- ----------------------------
DROP TABLE IF EXISTS `hot_desking_checkin`;
CREATE TABLE `hot_desking_checkin`  (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '签到id',
  `booking_id` int(11) NOT NULL COMMENT '预定id',
  `user_id` int(11) NOT NULL COMMENT '签到人',
  `create_time` datetime NOT NULL COMMENT '签到时间',
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建者',
  `is_delete` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_hot_desking_checkin_userid`(`user_id`) USING BTREE,
  INDEX `index_hot_desking_checkin_createtime`(`create_time`) USING BTREE,
  INDEX `index_hot_desking_checkin_0`(`booking_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 64 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_action
-- ----------------------------
DROP TABLE IF EXISTS `mg_action`;
CREATE TABLE `mg_action`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `path` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `pid` int(11) NULL DEFAULT NULL,
  `name` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `module` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `sub_module` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `desc` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `terminal` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_custom_types
-- ----------------------------
DROP TABLE IF EXISTS `mg_custom_types`;
CREATE TABLE `mg_custom_types`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `code` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `type` tinyint(4) NOT NULL COMMENT '1:设备类型 2.工位预定状态 3.工位基础信息 4.工作日管理',
  `value1` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `value2` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `value3` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `value4` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `value5` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `value6` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `value7` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `value8` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0:未删除 1:删除',
  `create_by` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_depart
-- ----------------------------
DROP TABLE IF EXISTS `mg_depart`;
CREATE TABLE `mg_depart`  (
  `de_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '部门编号',
  `de_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '部门名称',
  `des` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '描述',
  `code` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '部门代号',
  `parent_id` int(11) NULL DEFAULT NULL COMMENT '上级部门id',
  `fl_id` int(11) NULL DEFAULT NULL COMMENT '楼层id',
  `bu_id` int(11) NULL DEFAULT NULL COMMENT '大楼id',
  `create_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`de_id`) USING BTREE,
  UNIQUE INDEX `depart_code`(`code`) USING BTREE,
  UNIQUE INDEX `depart_name`(`de_name`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 66 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '部门' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_equipment
-- ----------------------------
DROP TABLE IF EXISTS `mg_equipment`;
CREATE TABLE `mg_equipment`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `ctype_id` int(11) NULL DEFAULT NULL,
  `code` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `space_id` int(11) NULL DEFAULT NULL,
  `status` tinyint(4) NULL DEFAULT 0 COMMENT '0：未绑定 1：已绑定',
  `create_time` datetime NOT NULL,
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_mg_equipment_0`(`ctype_id`, `space_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_material
-- ----------------------------
DROP TABLE IF EXISTS `mg_material`;
CREATE TABLE `mg_material`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '1：储物柜 2：工位 3：会议室',
  `image_url` varchar(150) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1：正常 2：停用',
  `width` double NOT NULL,
  `height` double NOT NULL,
  `text_x` double NOT NULL,
  `text_y` double NOT NULL,
  `font_size` double NOT NULL,
  `font_direction` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1：上 2：下 3：左 4：右',
  `create_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_menu
-- ----------------------------
DROP TABLE IF EXISTS `mg_menu`;
CREATE TABLE `mg_menu`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `code` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `is_valid` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0：生效 1：不生效',
  `level` tinyint(4) NOT NULL COMMENT '级数',
  `p_id` int(11) NOT NULL COMMENT '父级菜单id',
  `rank` int(11) NOT NULL COMMENT '菜单顺序',
  `create_time` datetime NOT NULL,
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_operation
-- ----------------------------
DROP TABLE IF EXISTS `mg_operation`;
CREATE TABLE `mg_operation`  (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '操作历史id',
  `user_id` int(11) NULL DEFAULT NULL COMMENT '用户id',
  `type` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '操作类型',
  `comment` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '更新时间',
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建者',
  `is_delete` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `operation_user_id`(`user_id`) USING BTREE,
  INDEX `operation_create_time`(`create_time`) USING BTREE,
  INDEX `operation_type`(`type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7462587 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_operation_log
-- ----------------------------
DROP TABLE IF EXISTS `mg_operation_log`;
CREATE TABLE `mg_operation_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '模块',
  `operation` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '操作',
  `user_id` int(11) NOT NULL,
  `result` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `comment` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `op_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  `create_time` datetime NOT NULL,
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_profile
-- ----------------------------
DROP TABLE IF EXISTS `mg_profile`;
CREATE TABLE `mg_profile`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '配置名称',
  `code` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '配置代号',
  `value1` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'value1',
  `value2` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'value2',
  `value3` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'value3',
  `comment` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '描述',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `create_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建者',
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '更新人',
  `is_delete` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for mg_repair
-- ----------------------------
DROP TABLE IF EXISTS `mg_repair`;
CREATE TABLE `mg_repair`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `space_id` int(11) NOT NULL COMMENT '空间id',
  `proof_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '图片地址，用逗号分割',
  `comment` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `user_id` int(11) NOT NULL COMMENT '用户id',
  `create_time` datetime NOT NULL,
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4434 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_repair_detail
-- ----------------------------
DROP TABLE IF EXISTS `mg_repair_detail`;
CREATE TABLE `mg_repair_detail`  (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '报修明细id',
  `pid` int(11) NOT NULL COMMENT '报修单id',
  `space_id` int(11) NOT NULL COMMENT '空间id',
  `equipment_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '设备编号',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '设备故障类型',
  `state` tinyint(1) NOT NULL COMMENT '1.待修复 2.已修复',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `user_id` int(11) NOT NULL COMMENT '报修人',
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '报修人名称',
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  `comment` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `proof_path` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '图片地址，多张用逗号分割',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_mg_repair_detail_0`(`user_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4445 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_role
-- ----------------------------
DROP TABLE IF EXISTS `mg_role`;
CREATE TABLE `mg_role`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `desc` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `create_time` datetime NOT NULL,
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  `type` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1：系统',
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `mg_roles_name`(`name`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_role_action
-- ----------------------------
DROP TABLE IF EXISTS `mg_role_action`;
CREATE TABLE `mg_role_action`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `action_id` int(11) NOT NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_role_menu
-- ----------------------------
DROP TABLE IF EXISTS `mg_role_menu`;
CREATE TABLE `mg_role_menu`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `menu_id` int(11) NOT NULL COMMENT '菜单id',
  `role_id` int(11) NOT NULL COMMENT '角色id',
  `is_delete` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0.未删除 1.已删除',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_mg_role_menu_0`(`role_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_setting
-- ----------------------------
DROP TABLE IF EXISTS `mg_setting`;
CREATE TABLE `mg_setting`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `is_valid` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0：生效 1：不生效',
  `value1` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `value2` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `type` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `sub_type` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `sub_sub_type` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `sub_sub_sub_type` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `rank` int(11) NOT NULL,
  `create_time` datetime NOT NULL,
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `create_by` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `mg_setting_name`(`name`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_space
-- ----------------------------
DROP TABLE IF EXISTS `mg_space`;
CREATE TABLE `mg_space`  (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '名称',
  `building_id` int(11) NULL DEFAULT NULL COMMENT '建筑id',
  `floor_id` int(11) NULL DEFAULT NULL COMMENT '楼层id',
  `area_id` int(11) NULL DEFAULT NULL,
  `category` int(255) NULL DEFAULT NULL COMMENT '空间类型\r\n1-工位  2-会议室，3-公共空间',
  `category_second` int(255) NULL DEFAULT NULL COMMENT '空间子类型\r\n1-工位（1-固定， 2-移动）\r\n2-会议室（ 1-小型，2-中型，3-大型）\r\n3-公共空间（ 1-洽谈区，2-休息区，3-就餐区， 4-电话亭）\r\n',
  `config` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '空间设备配置',
  `memo` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '备注',
  `area` double NULL DEFAULT NULL COMMENT '面积',
  `seating_capacity` int(11) NULL DEFAULT NULL COMMENT '座位数量',
  `code` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '空间代号',
  `dimension_x` int(11) NULL DEFAULT NULL,
  `dimension_y` int(11) NULL DEFAULT NULL,
  `degree` double(11, 0) NULL DEFAULT NULL COMMENT '旋转角度',
  `width` int(11) NULL DEFAULT NULL,
  `length` int(11) NULL DEFAULT NULL,
  `height` int(11) NULL DEFAULT NULL,
  `status` tinyint(4) NULL DEFAULT 1 COMMENT '1：待绑定 2：已启用 3：已停用',
  `attr1` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '会议室属性1 1.预定需审核 0.预定无需审核',
  `attr2` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '会议室属性2 会议室图片路径',
  `attr3` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '会议室属性3 1.无需签到 2.人脸识别 3.二维码签到 4.密码签到',
  `attr4` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '会议室属性4 会议室管理员，多个管理员用逗号分割',
  `attr5` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `attr6` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `index_mg_space_0`(`code`) USING BTREE,
  INDEX `index_mg_space_1`(`floor_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1213 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_staff
-- ----------------------------
DROP TABLE IF EXISTS `mg_staff`;
CREATE TABLE `mg_staff`  (
  `st_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '员工编号主键',
  `third_party_id` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '第三方id',
  `st_name` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '员工名称',
  `code` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '员工代号',
  `password` char(64) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'e10adc3949ba59abbe56e057f20f883e',
  `email` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `st_part` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '员工部门名称',
  `bu_id` int(11) NULL DEFAULT NULL COMMENT '员工所属大厦',
  `fl_id` int(11) NULL DEFAULT NULL COMMENT '员工所在楼层',
  `space_id` int(11) NULL DEFAULT NULL COMMENT '空间id',
  `entry_time` datetime NULL DEFAULT NULL COMMENT '入职时间',
  `leave_time` datetime NULL DEFAULT NULL COMMENT '离职时间',
  `depart_id` int(11) NULL DEFAULT NULL COMMENT '部门id',
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `avatar_path` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '用户头像路径',
  PRIMARY KEY (`st_id`) USING BTREE,
  UNIQUE INDEX `mg_staff_code`(`code`) USING BTREE,
  UNIQUE INDEX `mg_staff_st_name`(`st_name`) USING BTREE,
  UNIQUE INDEX `mg_staff_space_id`(`space_id`) USING BTREE,
  UNIQUE INDEX `mg_staff_email`(`email`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1633 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for mg_staff_role
-- ----------------------------
DROP TABLE IF EXISTS `mg_staff_role`;
CREATE TABLE `mg_staff_role`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for mg_tasklist
-- ----------------------------
DROP TABLE IF EXISTS `mg_tasklist`;
CREATE TABLE `mg_tasklist`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '名称',
  `code` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '代号',
  `status` tinyint(1) NOT NULL COMMENT '状态 1.running 2.waiting 3.stop',
  `data` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '任务参数',
  `cron_express` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'cron表达',
  `last_result` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `comment` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `next_run_time` datetime NULL DEFAULT NULL COMMENT '下一次执行时间',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建者',
  `is_delete` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `index_mg_tasklist_0`(`code`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mg_work_days
-- ----------------------------
DROP TABLE IF EXISTS `mg_work_days`;
CREATE TABLE `mg_work_days`  (
  `id` int(11) NOT NULL,
  `years` int(4) NOT NULL,
  `months` varchar(2) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `days` varchar(2) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `is_workday` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0：非工作日 1：工作日',
  `ctype_id` int(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for mq_consumers
-- ----------------------------
DROP TABLE IF EXISTS `mq_consumers`;
CREATE TABLE `mq_consumers`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '事件名称',
  `trigger_time` datetime NOT NULL COMMENT '触发时间',
  `state` tinyint(1) NOT NULL COMMENT '0.未执行 1.运行中 1.已完成 2.失败',
  `retry` tinyint(1) NULL DEFAULT NULL COMMENT '重试次数',
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '消息内容',
  `create_time` datetime NOT NULL COMMENT '创建内容',
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '创建人',
  `fail_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '失败原因',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_mq_consumers_0`(`trigger_time`, `state`) USING BTREE,
  INDEX `index_mq_consumers_1`(`state`, `trigger_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9221328 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for smart_meeting_attendee
-- ----------------------------
DROP TABLE IF EXISTS `smart_meeting_attendee`;
CREATE TABLE `smart_meeting_attendee`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) NOT NULL COMMENT '预定id',
  `invite_id` int(11) NOT NULL COMMENT '邀请人',
  `user_id` int(11) NULL DEFAULT NULL COMMENT '参会人id',
  `user_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `email` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '用户邮箱',
  `user_type` tinyint(1) NOT NULL COMMENT '1.企业内部人员 2.外部参会人员',
  `accept` tinyint(1) NULL DEFAULT NULL COMMENT '1.同意 2.拒绝',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_smart_meeting_attendee_1`(`booking_id`) USING BTREE,
  INDEX `index_smart_meeting_attendee_2`(`invite_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for smart_meeting_booking
-- ----------------------------
DROP TABLE IF EXISTS `smart_meeting_booking`;
CREATE TABLE `smart_meeting_booking`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `building_id` int(11) NOT NULL COMMENT '园区大厦id',
  `floor_id` int(11) NOT NULL COMMENT '楼层id',
  `area_id` int(11) NULL DEFAULT NULL COMMENT '区域id',
  `space_id` int(11) NOT NULL COMMENT '会议室id',
  `confirm` tinyint(1) NOT NULL COMMENT '1.无需审批 2.未通过 3.通过',
  `state` tinyint(1) NOT NULL COMMENT '1.未开始 2.会议中 3.已结束',
  `release_type` tinyint(1) NULL DEFAULT NULL COMMENT '1.提前结束 2.正常结束 3.延长后结束 4.未签到自动释放 5.未审核自动释放 6.审核未通过释放',
  `type` tinyint(1) NOT NULL COMMENT '1.时段预约 2.全天预约 3.立即使用',
  `start_time` datetime NOT NULL COMMENT '预约开始时间',
  `end_time` datetime NOT NULL COMMENT '预约结束时间',
  `use_start_time` datetime NOT NULL COMMENT '开始使用时间',
  `use_end_time` datetime NOT NULL COMMENT '结束使用时间',
  `topic` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '会议主题',
  `moderator` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '主持人',
  `remind_type` tinyint(1) NOT NULL COMMENT '1. 短信 2. 邮件 3.企业微信 4.钉钉',
  `need_checkin` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0.否 1.是',
  `checkin_type` tinyint(1) NULL DEFAULT NULL COMMENT '1.二维码签到 2.人脸识别 3.密码签到 ',
  `effective_check_minutes` int(11) NOT NULL COMMENT '有效签到时间',
  `comment` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `user_id` int(11) NOT NULL COMMENT '预约人',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建人',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `index_smart_meeting_booking_1`(`start_time`, `end_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for smart_meeting_checkin
-- ----------------------------
DROP TABLE IF EXISTS `smart_meeting_checkin`;
CREATE TABLE `smart_meeting_checkin`  (
  `id` int(11) NOT NULL COMMENT '签到id',
  `booking_id` int(11) NOT NULL COMMENT '预定id',
  `attendee_id` int(11) NOT NULL COMMENT '参会id',
  `create_time` datetime NOT NULL COMMENT '签到时间',
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '创建者',
  `is_delete` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for smart_meeting_service
-- ----------------------------
DROP TABLE IF EXISTS `smart_meeting_service`;
CREATE TABLE `smart_meeting_service`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) NOT NULL COMMENT '预约id',
  `ctype_id` int(11) NOT NULL COMMENT '服务类型id',
  `comment` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `cost` decimal(10, 2) NOT NULL COMMENT '费用',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '更新时间',
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for sys_area
-- ----------------------------
DROP TABLE IF EXISTS `sys_area`;
CREATE TABLE `sys_area`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `bu_id` int(11) NOT NULL,
  `fl_id` int(11) NOT NULL,
  `area` double NULL DEFAULT NULL,
  `dimension_x` int(11) NULL DEFAULT NULL,
  `dimension_y` int(11) NULL DEFAULT NULL,
  `width` int(11) NULL DEFAULT NULL,
  `length` int(11) NULL DEFAULT NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `area_code`(`code`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sys_build
-- ----------------------------
DROP TABLE IF EXISTS `sys_build`;
CREATE TABLE `sys_build`  (
  `bu_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '大厦id',
  `bu_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '大厦名称',
  `bu_coordinate` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '大厦地图坐标',
  `bu_addr` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '大厦地址',
  `bu_downtown` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '大厦所属城市',
  `bu_morning` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '早晨工作时间段',
  `bu_afternoon` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '下午工作时间段',
  `bu_allday` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '全天工作时间段',
  `bu_workday` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '工作日',
  `target_rate` decimal(5, 2) NULL DEFAULT NULL COMMENT 'kpi(目标使用率)',
  `x` double NULL DEFAULT NULL,
  `y` double NULL DEFAULT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '大厦代号',
  `target_rate_1` double NULL DEFAULT NULL COMMENT '工位目标使用率',
  `target_rate_2` double NULL DEFAULT NULL COMMENT '会议室目标使用率',
  `target_rate_3` double NULL DEFAULT NULL COMMENT '公共区域目标使用率',
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`bu_id`) USING BTREE,
  UNIQUE INDEX `sys_build_code`(`code`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sys_floor
-- ----------------------------
DROP TABLE IF EXISTS `sys_floor`;
CREATE TABLE `sys_floor`  (
  `fl_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '大厦编号',
  `bu_id` int(11) NOT NULL COMMENT '楼层编号',
  `fl_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '楼层名称',
  `fl_area` double NULL DEFAULT NULL COMMENT '楼层面积',
  `code` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '楼层代号',
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `small_image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `target_rate_1` double NULL DEFAULT NULL COMMENT '工位目标使用率',
  `target_rate_2` double NULL DEFAULT NULL COMMENT '会议室目标使用率',
  `target_rate_3` double NULL DEFAULT NULL COMMENT '公共区域目标使用率',
  `target_rate` double NULL DEFAULT NULL COMMENT '目标使用率',
  `ctype_id` int(11) NULL DEFAULT NULL,
  `create_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NULL DEFAULT 0,
  `create_by` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`fl_id`) USING BTREE,
  INDEX `sys_floor_buid`(`bu_id`) USING BTREE,
  CONSTRAINT `sys_floor_buid` FOREIGN KEY (`bu_id`) REFERENCES `sys_build` (`bu_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB AUTO_INCREMENT = 76 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
