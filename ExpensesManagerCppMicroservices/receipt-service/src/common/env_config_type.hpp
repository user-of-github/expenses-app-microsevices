#ifndef RECEIPT_SERVICE_ENV_CONFIG_TYPE_HPP
#define RECEIPT_SERVICE_ENV_CONFIG_TYPE_HPP

#include <string>

struct EnvConfigType {
    std::string db_host{"127.0.0.1"};
    std::string db_name{"expense_db"};
    std::string db_user{"postgres"};
    std::string db_password{};
    unsigned short db_port{5432};
    unsigned short app_port{4000};
};

#endif //RECEIPT_SERVICE_ENV_CONFIG_TYPE_HPP
