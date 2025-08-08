# KPO Project Name Generator

A React application that generates professional project names for Polish KPO (Krajowy Plan Odbudowy) funding applications using Perplexity AI.

## Features

- Form with 4 fields: business type, PKD code, postal code, and political connections checkbox
- Data sanitization and validation
- Rate limiting (10 requests per day per IP)
- Integration with Supabase for data storage
- AI-powered project name generation using Perplexity API
- Modern, responsive UI with smooth animations

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Netlify Functions
- **Database**: Supabase
- **AI**: Perplexity LLM API
- **Deployment**: Netlify

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor
3. Update your `.env` file with the Supabase URL and anon key

### 3. Perplexity API Setup

1. Sign up for a Perplexity API account
2. Get your API key and add it to the `.env` file

### 4. Install Dependencies

```bash
npm install
```

### 5. Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
