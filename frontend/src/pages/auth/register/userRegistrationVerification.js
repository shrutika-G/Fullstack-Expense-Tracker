import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import AuthService from '../../../services/auth.service';
import Logo from '../../../components/utils/Logo';

const UserRegistrationVerification = () => {
    const navigate = useNavigate();
    const { email } = useParams();

    const { register, handleSubmit, formState } = useForm();

    const [response_error, setResponseError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true);
        setResponseError("");

        try {
            const response = await AuthService.verifyRegistrationVerificationCode(data.code);

            if (response && response.data && response.data.status === "SUCCESS") {
                navigate('/auth/success-registration');
            } else {
                setResponseError(response?.data?.response || "Verification failed!");
            }
        } catch (error) {
            console.log(error);

            if (error.response) {
                setResponseError(error.response.data?.response || "Verification failed!");
            } else {
                setResponseError("Server not reachable!");
            }
        }

        setIsLoading(false);
    };

    const resendCode = async () => {
        setIsSending(true);
        setResponseError("");

        try {
            await AuthService.resendRegistrationVerificationCode(email);
            alert("Verification code sent again!");
        } catch (error) {
            console.log(error);
            setResponseError("Unable to resend code. Try again later!");
        }

        setIsSending(false);
    };

    return (
        <div className='container'>
            <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                <Logo />

                <h2>Verify your email</h2>

                {response_error !== "" && <p>{response_error}</p>}

                <div className='msg'>
                    Verification code has been sent to{" "}
                    <span style={{ fontWeight: 600, color: 'green' }}>
                        {email}
                    </span>
                </div>

                <br />

                <div className='input-box'>
                    <label>Verification Code</label><br />
                    <input
                        placeholder='Enter verification code'
                        type='text'
                        {...register('code', {
                            required: "Code is required!"
                        })}
                    />
                    {formState.errors.code && (
                        <small>{formState.errors.code.message}</small>
                    )}
                </div>

                <div className='msg' style={{ fontWeight: 600, fontStyle: 'italic' }}>
                    Please note that the verification code will expire soon!
                </div>

                <br />

                <div className='input-box'>
                    <input
                        type='submit'
                        value={isLoading ? "Verifying..." : 'Verify'}
                        className={isLoading ? "button button-fill loading" : "button button-fill"}
                    />
                </div>

                <br />

                <div className='msg'>
                    Having problems?{" "}
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={resendCode}
                        className='inline-link'
                    >
                        {isSending ? "Sending..." : "Resend code"}
                    </span>
                </div>
            </form>
        </div>
    );
};

export default UserRegistrationVerification;

