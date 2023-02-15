import { useCallback, useEffect, useState, useRef } from "react";

export const useHttpClient = () => {
    const [error, setError] = useState();
    const [isLoading, setIsLoading] = useState(false);

    const activeHttpRequests = useRef([])
    const sendRequest = useCallback(async (url, method = 'GET', body = null, headers = {}) => {
        setIsLoading(true)

        const httpAbortCtrl = new AbortController();
        activeHttpRequests.current.push(httpAbortCtrl);

        try {
            const response = await fetch(url, {
                method,
                body,
                headers,
                signal: httpAbortCtrl.signal
            });
            const responseData = await response.json();

            activeHttpRequests.current = activeHttpRequests.current.filter(
                reqCtrl => reqCtrl !== httpAbortCtrl
            );// clears the rqsts

            if (!response.ok) {
                throw new Error(responseData.message)
            }
            setIsLoading(false)
            return responseData;
        } catch (error) {
            if (error.name !== "AbortError") {
                setError(error.message)
                setIsLoading(false)
                throw error
            }
            
        }
    }, []);
    const clearError = () => {
        setError(null);
    }

    useEffect(() => {
        return () => {
            activeHttpRequests.current.forEach(abortCtrl => abortCtrl.abort());
        };
    }, [])

    return { isLoading, error, sendRequest, clearError };
}
//useCallback wont let it reinitialise when the component using it rerenders