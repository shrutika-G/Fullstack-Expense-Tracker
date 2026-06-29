import { useState } from 'react';
import '../../../assets/styles/register.css';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../../services/auth.service';
import Logo from '../../../components/utils/Logo';

function Login() {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const [response_error, setResponseError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loginRole, setLoginRole] = useState("ROLE_USER");

    const onSubmit = async (data) => {
        setIsLoading(true);
        setResponseError("");

        try {
            const response = await AuthService.login_req(data.email, data.password);

            console.log("Login response:", response.data);

            const user = response?.data;

            if (!user || !user.roles) {
                setResponseError("Invalid response from server!");
                setIsLoading(false);
                return;
            }

            const roles = Array.isArray(user.roles)
                ? user.roles.map((role) =>
                    typeof role === "string" ? role : role.name
                )
                : [];

            if (!roles.includes(loginRole)) {
                localStorage.removeItem("user");
                sessionStorage.clear();

                setResponseError(
                    loginRole === "ROLE_ADMIN"
                        ? "You are not allowed to login as Admin!"
                        : "You are not allowed to login as User!"
                );

                setIsLoading(false);
                return;
            }

            const updatedUser = {
                ...user,
                roles: roles
            };

            localStorage.setItem("user", JSON.stringify(updatedUser));

            localStorage.setItem(
                "message",
                JSON.stringify({
                    status: "SUCCESS",
                    text: "Login successful!"
                })
            );

            if (loginRole === "ROLE_ADMIN") {
                navigate("/admin/transactions", { replace: true });
            } else {
                navigate("/user/dashboard", { replace: true });
            }

        } catch (error) {
            console.log("Login error:", error);

            const resMessage =
                error?.response?.data?.message ||
                error?.response?.data ||
                error.message ||
                error.toString();

            if (resMessage === "Bad credentials") {
                setResponseError("Invalid email or password!");
            } else if (error?.response?.status === 401) {
                setResponseError("Invalid email or password!");
            } else {
                setResponseError("Something went wrong. Try again later!");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='container'>
            <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                <Logo />

                <h2>Login</h2>

                {response_error && (
                    <p className="error-msg">{response_error}</p>
                )}

                <div className='input-box'>
                    <label htmlFor="loginRole">Login As</label><br />
                    <select
                        id="loginRole"
                        value={loginRole}
                        onChange={(e) => setLoginRole(e.target.value)}
                    >
                        <option value="ROLE_USER">User</option>
                        <option value="ROLE_ADMIN">Admin</option>
                    </select>
                </div>

                <div className='input-box'>
                    <label htmlFor="email">Email</label><br />
                    <input
                        id="email"
                        type='text'
                        {...register('email', {
                            required: "Email is required!",
                            pattern: {
                                value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                                message: "Invalid email address!"
                            }
                        })}
                    />
                    {errors.email && <small>{errors.email.message}</small>}
                </div>

                <div className='input-box'>
                    <label htmlFor="password">Password</label><br />
                    <input
                        id="password"
                        type='password'
                        {...register('password', {
                            required: 'Password is required!'
                        })}
                    />
                    {errors.password && <small>{errors.password.message}</small>}
                </div>

                <div className='msg'>
                    <Link to='/auth/forgetpassword/verifyEmail' className='inline-link'>
                        Forgot password?
                    </Link>
                </div>

                <br />

                <div className='input-box'>
                    <input
                        type='submit'
                        disabled={isLoading}
                        value={isLoading ? "Logging in..." : "Login"}
                        className={
                            isLoading
                                ? "button button-fill loading"
                                : "button button-fill"
                        }
                    />
                </div>

                <br />

                <div className='msg'>
                    New member?{" "}
                    <Link to='/auth/register' className='inline-link'>
                        Register Here
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default Login;