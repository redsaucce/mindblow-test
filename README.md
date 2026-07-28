# Connect to the database via terminal (psql):
psql -U postgres -h localhost -p 5432 -d mindblow

# Resets the specified account's role to 'user'
UPDATE users SET role='user' WHERE email='drewbenettw@gmail.com';

# Elevates the specified account's role to 'admin'
UPDATE users SET role='admin' WHERE email='drewbenettw@gmail.com';

# To run backend, if in root dir, cd to server
cd server

# Activate virtual environment (Windows)
venv\Scripts\activate

# Start FastAPI app
uvicorn app.main:app --reload

# To run frontend, if in root dir, cd to client
cd client

# Start Next.js app
npm run dev



