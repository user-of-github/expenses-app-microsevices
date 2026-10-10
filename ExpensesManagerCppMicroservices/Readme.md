# _CPP Microservices application_
## _Expenses-manager microservices_
___   

### _Tech stack:_   
- _[Modern C++ 17/20](https://isocpp.org/)_  
- _[Drogon — C++17/20-based HTTP application framework](https://drogon.org/) || [[GIT]](https://github.com/drogonframework/drogon)_  
- _[Crow.cpp — C++ framework for creating HTTP or Websocket web services](https://crowcpp.org/)_
- _[Docker, Docker-Compose](https://www.docker.com/)_  
- _[PostrgreSQL](https://www.postgresql.org/)_
- _[Liquibase](https://www.liquibase.com/) for DB migrations_  
- _[OpenCode](opencode.ai) + [Alibaba Model Studio](https://www.alibabacloud.com/en?_p_lc=1) for consultations and boilerplate code generation_  
- _[GitHub Actions CI](https://github.com/features/actions) for some auto-deploy of Docker-containers_

___  
### _Installation:_  
- Fill .env with necessary DB data (see [.env.example](./.env.example) for reference)  
- If running services locally - make sure that configuration in CLion includes environment string same as in .env file  
- If running locally make cure, you have GNU supporting C++ 20 standard, and mentioned libs above. I have GNU 14 (GCC 14, G++ 14).    
- Make sure you have all libs installed. **Hint: you may use Dockerfile in REPORTS and RECEIPT microservices just to copy installations of C++ libs.**  

___  
### _Hints:_  
##### If no internet in Docker
- `sudo nano /etc/docker/daemon.json`
- Insert there:
```json
{
  "dns": ["8.8.8.8", "1.1.1.1"]
}
```  
- `Ctrl+O`, `Enter`, `Ctrl+X`  
- `sudo systemctl restart docker`

