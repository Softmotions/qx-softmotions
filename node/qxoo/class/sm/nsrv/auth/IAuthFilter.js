/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
/**
 * Интерфейс фильтра авторизации.
 */
qx.Interface.define("sm.nsrv.auth.IAuthFilter", {
      members:
      {
          /**
           * Аутентификация пользователя. В случае если пользователь аутентифицирован - выполняется <code>callback</code>.
           * Выполнение отого метода фильтра происходит для всех ресурсов, подлежащих аутентификации.
           * Если пользователь уже аутентифицирован - просто выполняется <code>callback</code>
           * @param request {ServerRequest}
           * @param response {ServerResponse}
           * @param callback
           */
          authenticate: function(request, response, callback) {
          },

          /**
           * Выход пользователя из системы. <code>callback</code> вызывается всегда!
           * @param request {ServerRequest}
           * @param response {ServerResponse}
           * @param callback
           */
          logout: function(request, response, callback) {
          },

          /**
           * Формирование ответа клиенту, в случае необходимости аутентификации (например, отправка кода ответа '401')
           * @param request {ServerRequest}
           * @param response {ServerResponse}
           * @param error
           */
          commence: function(request, response, error) {
          }
      }
  });
