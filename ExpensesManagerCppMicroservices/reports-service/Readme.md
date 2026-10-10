# _Reports Microservice_  
___  
## _Tech stack:_  
- _[Crow.cpp](https://crowcpp.org/master/)_  
- _C++ 17_  
- _[libxlsxwriter - Excel files generator](https://libxlsxwriter.github.io/)_  
- _[Postgres pl/pgSQL for creating reports bodies](https://www.postgresql.org/docs/8.1/plpgsql.html)_  
- _[OpenCode](https://opencode.ai/) + [Qwen 3.7 Plus (Alibaba Cloud Model Studio)](https://www.alibabacloud.com/help/en/model-studio/qwen3-7-plus)_  
___  
## _Flow_
- User sends query to `/generate/:report_id`  
- Service looks for Postgres-pl/pgSQL-procedure's name in DB table by this id  
- Service calls this pg-procedure and gets rows  
- Service renders XSLSX files  

## _TEST:_  
After launching via Docker-compose:    
`http://localhost:4001/generate/1`  


## _Advantage_
To add new custom (simple-structured) report - just add new Postgres-pl/pgSQL procedure via Liquibase migration
and register it in `reports_procedures_names` DB table via Liquibase seed-script.  
Now it can be accessible from client by id. 
Excel file will be generated automatically !
___   


## _Demo_  

![Demo](./demo/image.png)
