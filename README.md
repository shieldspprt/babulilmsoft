# ilmsoft

Modern School Management System for day-to-day administrative excellence.

ilmsoft is a premium, intuitive platform designed to streamline school operations, focusing on administrative efficiency rather than just education management. It empowers school administrators to handle complex daily tasks with ease and transparency.

## 🚀 Key Features

- **Student Registration**: Digital onboarding with automated ID generation and comprehensive student records.
- **Fee Collection**: Transparent tracking of payments, automated invoicing, and flexible fee structures.
- **Teacher Management**: Efficient staff oversight, profile management, and coordination tools.
- **Financial Reporting**: Real-time insights into income, expenses, and overall financial health with detailed reports.
- **Admin Dashboard**: A centralized hub for managing all aspects of your institution at a glance.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS with modern design principles (Glassmorphism, CSS Variables)
- **Backend**: Supabase (PostgreSQL, Auth)
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/ilmsoft.git
   cd ilmsoft
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🌐 Deployment

The application is optimized for deployment on Netlify or Vercel.

- **Netlify**: Connect your repository and it will automatically build using the provided `netlify.toml` configuration.
- **Vite Build**:
  ```bash
  npm run build
  ```

## 📄 License

This project is licensed under the MIT License.
