#include <utility>
#include <crow.h>
#include <iostream>
#include "./common/env.hpp"
#include "./modules/reports/reports_controller.hpp"
#include "./modules/reports/reports_repository.hpp"

int main() {
  try {
    const auto config {reports::common::load_env_config()};

    if (config.db_name.empty() || config.db_user.empty() || config.db_password.empty()) {
      std::cerr << "Error: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD must be set" << std::endl;
      return 1;
    }

    const auto conn_str{reports::common::build_connection_string(config)};
    const auto repo{std::make_shared<reports::ReportRepository>(conn_str)};

    reports::ReportController controller{repo};

    crow::SimpleApp app{};
    app.port(config.app_port);
    controller.register_routes(app);

    CROW_ROUTE(app, "/health")
    ([] {
      crow::response res{200, R"({"status":"ok"})"};
      res.set_header("Content-Type", "application/json");
      return res;
    });

    std::cout << "Reports service starting on port " << config.app_port << std::endl;
    app.run();

  } catch (const std::exception& e) {
    std::cerr << "Fatal error: " << e.what() << std::endl;
    return 1;
  }

  return 0;
}
