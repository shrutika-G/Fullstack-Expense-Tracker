import { useRef, useState } from 'react';
import '../../../assets/styles/register.css';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import AuthService from '../../../services/auth.service';
import Logo from '../../../components/utils/Logo';

function Register() {
    const navigate = useNavigate();

    const { register, handleSubmit, watch, formState } = useForm();
    const password = useRef({});
    password.current = watch('password', "");

    const [response_error, setResponseError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true);

        try {
            const response = await AuthService.register_req(
                data.username,
                data.email,
                data.password
            );

            console.log(response);

            if (response && response.data && response.data.status === "SUCCESS") {
                setResponseError("");
                navigate(`/auth/userRegistrationVerification/${data.email}`);
            } else {
                console.log("Backend error:", response?.data);
                setResponseError(
                response?.data?.response || "Registration failed!"
              );
         }

        } catch (error) {
            console.log(error);

            if (error.response) {
                setResponseError(
                    error.response.data?.response || "Registration failed!"
                );
            } else {
                setResponseError("Server not reachable!");
            }
        }

        setIsLoading(false);
    };

    return (
        <div className='container'>
            <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                <Logo />
                <h2>Register</h2>

                {response_error !== "" && <p>{response_error}</p>}

                <div className='input-box'>
                    <label>Username</label><br />
                    <input
                        type='text'
                        {...register('username', {
                            required: "Username is required!"
                        })}
                    />
                    {formState.errors.username && <small>{formState.errors.username.message}</small>}
                </div>

                <div className='input-box'>
                    <label>Email</label><br />
                    <input
                        type='text'
                        {...register('email', {
                            required: "Email is required!",
                            pattern: {
                                value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                                message: "Invalid email address!"
                            }
                        })}
                    />
                    {formState.errors.email && <small>{formState.errors.email.message}</small>}
                </div>

                <div className='input-box'>
                    <label>Password</label><br />
                    <input
                        type='password'
                        {...register('password', {
                            required: 'Password is required!',
                            minLength: {
                                value: 8,
                                message: "Password must have atleast 8 characters"
                            }
                        })}
                    />
                    {formState.errors.password && <small>{formState.errors.password.message}</small>}
                </div>

                <div className='input-box'>
                    <label>Confirm Password</label><br />
                    <input
                        type='password'
                        {...register('cpassword', {
                            required: 'Confirm password is required!',
                            validate: value =>
                                value === password.current || "Passwords do not match!"
                        })}
                    />
                    {formState.errors.cpassword && <small>{formState.errors.cpassword.message}</small>}
                </div>

                <div className='input-box'>
                    <input
                        type='submit'
                        value={isLoading ? "Please wait..." : 'Register'}
                        className={isLoading ? "button button-fill loading" : "button button-fill"}
                    />
                </div>

                <br />
                <div className='msg'>
                    By clicking Register, you agree to our policies.
                </div>

                <br />
                <div className='msg'>
                    Already a member? <Link to='/auth/login' className='inline-link'>Login Here</Link>
                </div>
            </form>
        </div>
    );
}

export default Register;
