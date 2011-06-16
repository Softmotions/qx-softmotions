/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
/**
 * Интерфейс менеджеров пользователей.
 *
 *  Объект-пользователь:
 *  <code>
 *  {
 *      login: "login",
 *      roles: ["roleId"...]
 *  }
 *  </code>
 *
 *  Роль:
 *  <code>
 *  {
 *      id: "id",
 *      parent: ["parentId"...]
 *  }
 *  </code>
 */
qx.Interface.define("sm.nsrv.auth.IUserProvider", {
      members :
      {
          /**
           * Проверяет авторизацию пользователя.
           * Если пользователь с указаной парой логин/пароль, во второй аргумент обработчика передаётся объект-пользователь, иначе <code>null</code>
           * @param login имя пользователя
           * @param password пароль
           * @param callback обработчик вида: <code>function(error, user)</code>
           *
           */
          login: function(login, password, callback) {
          },

          /**
           * Получение авторизационных данных пользователя. Необходим для работы алгоритма с Digest авторизацией и Form авторизацией с включённым режимом "запомни меня".
           * Если пользователь с указанным именем найден, во второй аргумент обработчика передаётся объект, содержащий авторизационные данные и объект-пользователь, иначе <code>null</code>
           * Замечание! Для работы с Digest алгоритмом возможны два варинта выдачи параметров авторизации:
           *  - если доступен пароль пользователя в незашифрованном виде, то объект авторизации содержит в поле <code>plainPassword<code> его значение,
           *    при этом, поле <code>realmName</code> должно быть <code>undefined</code>
           *  - если не доступен пароль в незашифрованном виде, то объект авторизации должен содержать поля <code>realmName</code> и <code>digestPassword</code>,
           *    причём, значение <code>digestPassword</code> должно быть вычислено по правилу: <code>md5(login + ':' + realmName + ':' + plainPassword)</code>;
           *    то есть, если в целях безопасности пароль необходимо сохранять в шифрованном виде, то его необходимо вычислять по указаному правилу.
           * @param login имя пользователя
           * @param callback обработчик вида: <code>function(error, auth)</code>
           */
          getAuthInfo: function(login, callback) {
          },

          /**
           * Array of all available roles:
           * Role element:
           * <code>
           *     id : {String}, //role ID,
           *     parent : {Array}, //Array of parent role ids
           *     desc : {String}  //Human readable role description
           *
           * </code>
           * @param callback <code>function(error, roles)</code>
           */
          getRolesList: function(callback) {
          }
      }
  });