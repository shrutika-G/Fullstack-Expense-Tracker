import { Link } from "react-router-dom";
import success from '../../../assets/images/success.gif';

function RegistrationSuccess() {
    return (
        <div className='container'>
            <div className="auth-form" style={{ textAlign: "center" }}>
                
                <img
                    src={success}
                    alt="success"
                    style={{ width: "120px", marginBottom: "10px" }}
                />

                <h4 style={{ color: "green" }}>
                    Congratulations! Your account has been successfully created!
                </h4>

                <br />

                <Link to='/auth/login'>
                    <button
                        className="button button-fill"
                        style={{ padding: '7px 25px' }}
                    >
                        Login now
                    </button>
                </Link>

            </div>
        </div>
    );
}

export default RegistrationSuccess;