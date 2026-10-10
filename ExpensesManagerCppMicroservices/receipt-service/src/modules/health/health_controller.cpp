#include "./health_controller.hpp"

namespace expenses::health {
  drogon::Task<drogon::HttpResponsePtr> HealthController::check(drogon::HttpRequestPtr req) const {
    Json::Value body{};
    body["status"] = "ok";
    co_return drogon::HttpResponse::newHttpJsonResponse(body);
  }
} // namespace expenses::health