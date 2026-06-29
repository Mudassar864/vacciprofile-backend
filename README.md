# VacciProfile - Backend API

Express.js backend API for vaccine profile management system with MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (see `.env.example` for all options):
   ```env
   MONGODB_URI=mongodb://localhost:27017/vacciprofile
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

   For **AI chat (Bedrock RAG)**, also set AWS credentials and knowledge base ID.  
   See [docs/BEDROCK_IAM_SETUP.md](./docs/BEDROCK_IAM_SETUP.md).

3. Start MongoDB (if running locally)

4. Start the server:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

The API will run on `http://localhost:3000`

## 🎯 Features

- ✅ JWT-based authentication
- ✅ User management (CRUD operations)
- ✅ Role-based access control (admin/user)
- ✅ Secure password hashing
- ✅ Automatic admin user creation
- ✅ Input validation
- ✅ RESTful API design
- ✅ CSV import/export functionality
- ✅ Populated endpoints with related data


## 🔌 API Endpoints

Base URL: `http://localhost:3000/api`


### Vaccines

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/vaccines/populated` | Get all vaccines with licensing dates and product profiles | Public |
| GET | `/vaccines/:id/populated` | Get single vaccine with licensing dates and product profiles | Public |
| GET | `/vaccines` | Get all vaccines | Admin |
| POST | `/vaccines` | Create new vaccine | Admin |
| GET | `/vaccines/:id` | Get vaccine by ID | Admin |
| PUT | `/vaccines/:id` | Update vaccine | Admin |
| DELETE | `/vaccines/:id` | Delete vaccine | Admin |

### Licensing Dates (Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/licensing-authorities` | Get all licensing authorities | Admin |
| POST | `/licensing-authorities` | Create new licensing authority | Admin |
| GET | `/licensing-authorities/:id` | Get licensing authority by ID | Admin |
| PUT | `/licensing-authorities/:id` | Update licensing authority | Admin |
| DELETE | `/licensing-authorities/:id` | Delete licensing authority | Admin |

### Product Profiles (Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/product-profiles` | Get all product profiles | Admin |
| POST | `/product-profiles` | Create new product profile | Admin |
| GET | `/product-profiles/:id` | Get product profile by ID | Admin |
| PUT | `/product-profiles/:id` | Update product profile | Admin |
| DELETE | `/product-profiles/:id` | Delete product profile | Admin |

### Manufacturers

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/manufacturers/populated` | Get all manufacturers with products, sources, vaccines, and candidates | Public |
| GET | `/manufacturers/:id/populated` | Get single manufacturer with products, sources, vaccines, and candidates | Public |
| GET | `/manufacturers` | Get all manufacturers | Admin |
| POST | `/manufacturers` | Create new manufacturer | Admin |
| GET | `/manufacturers/:id` | Get manufacturer by ID | Admin |
| PUT | `/manufacturers/:id` | Update manufacturer | Admin |
| DELETE | `/manufacturers/:id` | Delete manufacturer | Admin |

### Manufacturer Products (Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/manufacturer-products` | Get all manufacturer products | Admin |
| POST | `/manufacturer-products` | Create new manufacturer product | Admin |
| GET | `/manufacturer-products/:id` | Get manufacturer product by ID | Admin |
| PUT | `/manufacturer-products/:id` | Update manufacturer product | Admin |
| DELETE | `/manufacturer-products/:id` | Delete manufacturer product | Admin |

### Manufacturer Sources (Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/manufacturer-sources` | Get all manufacturer sources | Admin |
| POST | `/manufacturer-sources` | Create new manufacturer source | Admin |
| GET | `/manufacturer-sources/:id` | Get manufacturer source by ID | Admin |
| PUT | `/manufacturer-sources/:id` | Update manufacturer source | Admin |
| DELETE | `/manufacturer-sources/:id` | Delete manufacturer source | Admin |

### Pathogens

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/pathogens/populated` | Get all pathogens with vaccines (including licensing dates and product profiles) | Public |
| GET | `/pathogens/:id/populated` | Get single pathogen with vaccines (including licensing dates and product profiles) | Public |
| GET | `/pathogens` | Get all pathogens | Admin |
| POST | `/pathogens` | Create new pathogen | Admin |
| GET | `/pathogens/:id` | Get pathogen by ID | Admin |
| PUT | `/pathogens/:id` | Update pathogen | Admin |
| DELETE | `/pathogens/:id` | Delete pathogen | Admin |

### Manufacturer Candidates (Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/manufacturer-candidates` | Get all manufacturer candidates | Admin |
| POST | `/manufacturer-candidates` | Create new manufacturer candidate | Admin |
| GET | `/manufacturer-candidates/:id` | Get manufacturer candidate by ID | Admin |
| PUT | `/manufacturer-candidates/:id` | Update manufacturer candidate | Admin |
| DELETE | `/manufacturer-candidates/:id` | Delete manufacturer candidate | Admin |

### NITAGs (Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/nitags` | Get all NITAGs | Admin |
| POST | `/nitags` | Create new NITAG | Admin |
| GET | `/nitags/:id` | Get NITAG by ID | Admin |
| PUT | `/nitags/:id` | Update NITAG | Admin |
| DELETE | `/nitags/:id` | Delete NITAG | Admin |

### Licensers (Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/licensers` | Get all licensers | Admin |
| POST | `/licensers` | Create new licenser | Admin |
| GET | `/licensers/:id` | Get licenser by ID | Admin |
| PUT | `/licensers/:id` | Update licenser | Admin |
| DELETE | `/licensers/:id` | Delete licenser | Admin |


### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/health` | Server health check | Public |


## 🛡️ Security Features

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation
- Protected API routes
- Secure cookie handling

## 📝 Development

### Development Mode

```bash
npm run dev  # Uses nodemon for auto-reload
```

### Production Mode

```bash
npm start
```

## 📄 License

ISC
