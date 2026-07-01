CREATE DATABASE payrollBillingDB;
use payrollBillingDB;

DROP TABLE IF EXISTS worker;
DROP TABLE IF EXISTS work_order;
DROP TABLE IF EXISTS company;
DROP TABLE IF EXISTS wo_Items;
DROP TABLE IF EXISTS completedWO;

CREATE TABLE worker (
    workerID INTEGER,
    workerFName VARCHAR(10),
    workerLName VARCHAR(10),
    worker_User VARCHAR(10),
    workerPW VARCHAR(10),
    is_Admin boolean,
    PRIMARY KEY (workerID)
);

CREATE TABLE company (
	companyID INTEGER,
    company_Name VARCHAR(20),
	company_Address VARCHAR(20),
    company_Phone INTEGER,
    company_Email VARCHAR(20),
    PRIMARY KEY (companyID)
);

CREATE TABLE work_order (
    work_orderID INTEGER,
    workerID INTEGER, 
    companyID INTEGER,
    work_orderPDF VARCHAR(10),
    PRIMARY KEY (work_orderID)
);

CREATE TABLE wo_Items (
    wo_itemsID INTEGER,
    wo_Items VARCHAR(20),
    wo_Item_Price DOUBLE,
    wo_Item_Qty INTEGER,
    workerID INTEGER, 
    work_orderID INTEGER,
    companyID INTEGER,
    work_orderPDF VARCHAR(10), 
    foreign key (work_orderID) REFERENCES work_order(work_orderID),
    foreign key (companyID) REFERENCES company(companyID),
    PRIMARY KEY (wo_itemsID)
);

create TABLE completedWO (
	completedWOID INTEGER,
    work_orderID INTEGER,
    companyID INTEGER,
    file_no INTEGER,
    my_price DOUBLE,
    SBATotal DOUBLE,
    assessment VARCHAR(1),
    plat VARCHAR(1),
    address VARCHAR(25),
    wo_Date VARCHAR(25),
    PRIMARY KEY (completedWOID),
    foreign key (companyID) REFERENCES company(companyID),
    foreign key (work_orderID) REFERENCES work_Order(work_orderID)
);

-- Testing ground
INSERT INTO worker (workerID, workerFName, workerLName, worker_User, workerPW, is_Admin) 
VALUES (1001, 'Alfred', 'Smith', 'AS01', 'helloWorld', 1);

INSERT INTO work_order (work_orderID, workerID, companyID, work_orderPDF) 
VALUES (123456, 1001, 1006, 'afile.pdf');

show tables;

select * from worker;
select * from work_order;
select * from completedWO;


-- workOrder Test

-- Completed Work Order test


