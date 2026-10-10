cmake_minimum_required(VERSION 3.6)

# inserted it for json-cpp working properly
set(CMAKE_POLICY_VERSION_MINIMUM 3.5)

project(receipt_service CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Searching of libs, which I installed via apt-get or via cloning&building (like Drogon)
find_package(Drogon REQUIRED)
find_package(Jsoncpp REQUIRED)
# find_package(nlohmann_json REQUIRED)

# Automatic finding generated models from Drogon
file(GLOB_RECURSE GENERATED_DROGON_SOURCES
        "src/db/*.h"
        "src/db/*.cc"
)


# declaring executable file
add_executable(receipt_service src/main.cpp
        src/modules/classificator/classificator_dto.hpp
        src/modules/classificator/classificator_controller.cpp
        src/modules/classificator/classificator_controller.hpp
        src/modules/classificator/classificator_repository.cpp
        src/modules/classificator/classificator_repository.hpp
        src/common/env.hpp
        src/common/env_config_type.hpp
        src/common/drogon_db_config.hpp
        src/common/utils.hpp
        ${GENERATED_DROGON_SOURCES}
        src/common/exceptions.hpp
        src/modules/cheque/cheque_controller.cpp
        src/modules/cheque/cheque_controller.hpp
        src/modules/cheque/cheque_repository.cpp
        src/modules/cheque/cheque_repository.hpp
        src/modules/cheque/cheque_dto.hpp
        src/modules/health/health_controller.cpp
        src/modules/health/health_controller.hpp
)

# Linking libs to my file
target_link_libraries(
        receipt_service PRIVATE
        Drogon::Drogon
        Jsoncpp_lib
#        nlohmann_json::nlohmann_json
)