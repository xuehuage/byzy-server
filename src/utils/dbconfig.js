// 引入MySQL
import mySql from 'mysql2';

// created pool

const pool = mySql.createPool({
    host:'localhost',
    user:'root',
    password:'!fyh3759MYSQL',
    database:'byzy'
})

const sqlConnection = (sql,params,)=>{
    return new Promise((resolve,reject)=>{
        pool.getConnection((err,connection)=>{
            if(err){
                console.log('getConnection err:',err);
                reject(err);
                return 
                
            }
            connection.query(sql,params,(err,result)=>{
                if(err){
                    console.log('connection err:',err);
                    reject(err);
                    return 
                    
                }
                resolve(result);
                // 断开连接
                connection.release();
            })
        })
    })
}

module.exports = {
    sqlConnection
}