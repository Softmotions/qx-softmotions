/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Mixin.define("sm.nsrv.auth.MUserProvider", {

      members:
      {
          /**
           * "Развязка" зависимостей ролей: построение на основании явно указанных ролей пользователя полного списка его ролей
           * @param roles описание всех доступных в системе ролей: <code>{'id' : {id: 'id', parent: ['pid'...]} ...}</code>
           * @param userRoles список явно укзанных ролей пользователя: <code>['roleId'...]</code>
           */
          getUserRoles: function(roles, userRoles) {
              var result = [];

              var trole;
              var troleId;
              var troles = [].concat(userRoles || []);
              while (troleId = troles.pop()) {
                  if (trole = roles[troleId]) {
                      result.push(trole.id);
                      troles = trole.parent ? troles.concat(trole.parent) : troles;
                  }
              }

              return result;
          }
      }
  });
