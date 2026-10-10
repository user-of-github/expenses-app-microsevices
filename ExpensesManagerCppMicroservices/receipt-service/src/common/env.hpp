#ifndef RECEIPT_SERVICE_ENV_HPP
#define RECEIPT_SERVICE_ENV_HPP

#include <string>
#include "./env_config_type.hpp"

namespace expenses::common {
    inline EnvConfigType load_env_config() {
        EnvConfigType response{};

        if (const char* host {std::getenv("POSTGRES_HOST")}) {
            response.db_host = host;
        }
        if (const char* name {std::getenv("POSTGRES_DB")}) {
            response.db_name = name;
        }
        if (const char* user {std::getenv("POSTGRES_USER")}) {
            response.db_user = user;
        }
        if (const char* password {std::getenv("POSTGRES_PASSWORD")}) {
            response.db_password = password;
        }
        if (const char* db_port {std::getenv("POSTGRES_PORT")}) {
            response.db_port = std::stoi(db_port);
        }
        if (const char* app_port {std::getenv("CHEQUES_SERVICE_APP_PORT")}) {
            response.app_port = std::stoi(app_port);
        }

        return response;
    }
}

#endif //RECEIPT_SERVICE_ENV_HPP
