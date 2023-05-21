const express = require('express')
const mysql = require('mysql')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors')

const app = express()
app.use(cors());
app.use(express.json()) 

const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"userdata"
})

app.listen(8081,() => {
    console.log('Listening...')
})
 
//user register into users table
app.post('/signup/', (req, res) => {
  const { name, email, password } = req.body;
  const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkUserQuery, [email], (error, results) => {
      if (results.length > 0) {
        res.status(200).send({ message: 'User already Register' });
      } else {
        // Insert the new user into the database
        const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(insertUserQuery, [name, email, password], (err) => {
          if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            res.status(201).send({ message: 'User registered successfully' });
          } 
        });
    }
  });
});

//user logged into users table
app.post('/login/',(req, res) => {
  const { name, password } = req.body;
  const checkUserQuery = 'SELECT * FROM users WHERE name = ?';
  db.query(checkUserQuery, [name], (error, results) => {
    // console.log(results)
      if (results.length === 0) {
        res.status(400).send("Invalid User");
      } else {
        const user = results[0];
        bcrypt.compare(password, user.password, (err, result) => {
          console.log(result)
          console.log(err)
          if (err) {
            return res.status(401).send('Invalid password');
          } else {
            // Generate and sign a JWT token
            const token = jwt.sign({ id: user.id, email: user.email }, 'your_secret_key');
            // console.log(token)
            res.status(200).send({token});  
          }
        }); 
    }
  });
});

// add todo item in todos table
app.post('/todos/',(req, res) => {
  const { task_name, task_status } = req.body;

    db.query(
      'INSERT INTO todos (task_name, task_status) VALUES (?, ?)',
      [task_name, task_status],(error,results) =>{
        if(error){
          console.error('Error adding todo item:', error);
          return res.status(500).json({ error: 'Server error' });
        }
        else{
          return res.sendStatus(201);
        }
      });
});


//fetch todo items from the todos table
app.get('/todos', (req, res) => {
  const query = 'SELECT * FROM todos';

  db.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching todos:', error);
      res.status(500).json({ error: 'Failed to fetch todos' });
    } else {
      res.json(results);
    }
  });
});

// delete the todo item from the todos table
app.delete('/todos/:id', (req, res) => {
  const todoId = req.params.id;

  const query = `DELETE FROM todos WHERE task_id = ${todoId}`;

  db.query(query, (error, result) => {
    if (error) {
      console.error('Error deleting todo:', error);
      res.status(500).json({ error: 'Failed to delete todo' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Todo not found' });
    } else {
      res.json({ message: 'Todo deleted successfully' });
    }
  });
});
