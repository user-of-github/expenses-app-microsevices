#ifndef RECEIPT_SERVICE_HEALTH_CONTROLLER_HPP
#define RECEIPT_SERVICE_HEALTH_CONTROLLER_HPP

#pragma once

#include <drogon/drogon.h>

namespace expenses::health {
  class HealthController : public drogon::HttpController<HealthController> {
  public:
    METHOD_LIST_BEGIN
      ADD_METHOD_TO(HealthController::check, "/health", drogon::Get);
    METHOD_LIST_END

    drogon::Task<drogon::HttpResponsePtr> check(drogon::HttpRequestPtr req) const;
  };
} // namespace expenses::health

#endif //RECEIPT_SERVICE_HEALTH_CONTROLLER_HPP