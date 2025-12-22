import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to MoneyGrowLife</h1>
        <p>Your journey to financial growth starts here</p>
        <Link to="/login" className="btn-primary">
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default Home;

