import React, { useState, useEffect, useRef } from 'react';

// Main App component
const App = () => {
    // State to hold simulated car data
    const [engineTemp, setEngineTemp] = useState(90); // Celsius
    const [errorCodes, setErrorCodes] = useState([]); // List of simulated error codes
    // FIX: Corrected useState declaration for gearChangeSmoothness
    const [gearChangeSmoothness, setGearChangeSmoothness] = useState(5); // 1 (smooth) to 10 (rough)
    const [accelerationSoundLevel, setAccelerationSoundLevel] = useState(60); // dB

    // States for fluid levels and leakage
    const [transmissionOilLevel, setTransmissionOilLevel] = useState(9); // 1 (very low) to 10 (full)
    const [engineOilLevel, setEngineOilLevel] = useState(9); // 1 (very low) to 10 (full)
    const [coolantLevel, setCoolantLevel] = useState(9); // 1 (very low) to 10 (full)
    const [leakageDetected, setLeakageDetected] = useState(false); // Boolean for general leakage

    // New states for AI model output
    const [aiAnomalyDetected, setAiAnomalyDetected] = useState(false);
    const [aiAnomalyDetails, setAiAnomalyDetails] = useState("AI monitoring for unusual patterns...");
    const [aiLoading, setAiLoading] = useState(false); // To show loading state for AI

    const [carStatus, setCarStatus] = useState("Normal"); // Overall car status
    const [problemDetails, setProblemDetails] = useState(""); // Details about detected problems

    // Refs to keep track of consecutive problematic readings
    const highTempCountRef = useRef(0);
    const specificErrorCountRef = useRef(0);
    const roughGearChangeCountRef = useRef(0);
    const highSoundLevelCountRef = useRef(0);
    const lowTransmissionOilCountRef = useRef(0);
    const lowEngineOilCountRef = useRef(0);
    const lowCoolantCountRef = useRef(0);
    const leakageCountRef = useRef(0);

    // Constants for problem detection rules
    const TEMP_THRESHOLD = 105; // Degrees Celsius
    const CONSECUTIVE_HIGH_TEMP_LIMIT = 5;
    const SPECIFIC_ENGINE_ERROR_CODE = "P0301"; // Example engine error (e.g., cylinder 1 misfire)
    const TRANSMISSION_ERROR_CODES = ["P0700", "P0701", "P0702", "P0703"]; // Example transmission errors
    const FREQUENT_ERROR_THRESHOLD = 3;

    const ROUGH_GEAR_THRESHOLD = 7; // Smoothness value above which it's considered rough
    const CONSECUTIVE_ROUGH_GEAR_LIMIT = 3;
    const HIGH_SOUND_THRESHOLD = 85; // dB level considered high
    const CONSECUTIVE_HIGH_SOUND_LIMIT = 4;

    // Constants for fluid levels and leakage
    const LOW_FLUID_THRESHOLD = 3; // Level below which fluid is considered low (out of 10)
    const CONSECUTIVE_LOW_FLUID_LIMIT = 2;
    const CONSECUTIVE_LEAKAGE_LIMIT = 1;

    // Simulate car data updates and AI analysis every second
    useEffect(() => {
        const interval = setInterval(async () => { // Made async to await AI response
            // --- Simulate Sensor Data ---
            const newTemp = Math.floor(Math.random() * (115 - 85 + 1)) + 85;
            setEngineTemp(newTemp);

            if (Math.random() < 0.15) {
                const allErrors = [
                    "P0101", "P0420", SPECIFIC_ENGINE_ERROR_CODE, "P0000", SPECIFIC_ENGINE_ERROR_CODE,
                    ...TRANSMISSION_ERROR_CODES, "U0100"
                ];
                const randomError = allErrors[Math.floor(Math.random() * allErrors.length)];
                setErrorCodes(prev => [...prev, randomError].slice(-5));
            } else {
                setErrorCodes([]);
            }

            const newGearSmoothness = Math.random() < 0.2 ? Math.floor(Math.random() * (10 - 6 + 1)) + 6 : // 20% chance of rough (6-10)
                                      Math.floor(Math.random() * (5 - 1 + 1)) + 1; // 80% chance of smooth (1-5)
            setGearChangeSmoothness(newGearSmoothness);

            const newSoundLevel = Math.random() < 0.18 ? Math.floor(Math.random() * (95 - 80 + 1)) + 80 :
                                  Math.floor(Math.random() * (75 - 55 + 1)) + 55;
            setAccelerationSoundLevel(newSoundLevel);

            const simulateFluidLevel = () => {
                return Math.random() < 0.1 ? Math.floor(Math.random() * (LOW_FLUID_THRESHOLD - 1 + 1)) + 1 :
                                             Math.floor(Math.random() * (10 - (LOW_FLUID_THRESHOLD + 1) + 1)) + (LOW_FLUID_THRESHOLD + 1);
            };
            setTransmissionOilLevel(simulateFluidLevel());
            setEngineOilLevel(simulateFluidLevel());
            setCoolantLevel(simulateFluidLevel());

            setLeakageDetected(Math.random() < 0.05);

            // --- Simulate AI Model Analysis ---
            setAiLoading(true); // Set loading state for AI
            try {
                const prompt = `Analyze the following car sensor data and determine if there is an unforeseen anomaly or a "new problem" not covered by standard error codes. Respond with a JSON object.
                Current Car Data:
                - Engine Temperature: ${newTemp}°C
                - Error Codes: ${errorCodes.join(', ') || 'None'}
                - Gear Change Smoothness: ${newGearSmoothness}/10
                - Acceleration Sound Level: ${newSoundLevel} dB
                - Transmission Oil Level: ${transmissionOilLevel}/10
                - Engine Oil Level: ${engineOilLevel}/10
                - Coolant Level: ${coolantLevel}/10
                - Leakage Detected: ${leakageDetected ? 'Yes' : 'No'}

                Consider if the combination of these parameters suggests something unusual or a developing issue.
                Output JSON schema:
                {
                  "anomalyDetected": boolean,
                  "details": string
                }
                If no anomaly, set anomalyDetected to false and details to "No unusual patterns detected."
                `;

                let chatHistory = [];
                chatHistory.push({ role: "user", parts: [{ text: prompt }] });
                const payload = {
                    contents: chatHistory,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: {
                                "anomalyDetected": { "type": "BOOLEAN" },
                                "details": { "type": "STRING" }
                            },
                            "propertyOrdering": ["anomalyDetected", "details"]
                        }
                    }
                };
                const apiKey = ""; // Canvas will automatically provide this
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                // Log the full result for debugging
                console.log("AI API Response Status:", response.status);
                const rawResponseText = await response.text(); // Get raw response text
                console.log("AI API Raw Response Text:", rawResponseText);

                let result;
                if (rawResponseText) { // Ensure raw text is not empty before parsing
                    try {
                        result = JSON.parse(rawResponseText); // Parse the raw text
                    } catch (parseError) {
                        console.error("Error parsing raw AI model response text:", parseError);
                        setAiAnomalyDetected(false);
                        setAiAnomalyDetails("AI response malformed or incomplete.");
                        setAiLoading(false);
                        return; // Exit if raw parsing fails
                    }
                } else {
                    setAiAnomalyDetected(false);
                    setAiAnomalyDetails("AI returned empty response body.");
                    setAiLoading(false);
                    return; // Exit if raw response is empty
                }

                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const jsonString = result.candidates[0].content.parts[0].text;
                    
                    // Log the extracted JSON string for debugging
                    console.log("AI API JSON String from candidate:", jsonString);

                    if (jsonString) { // Ensure jsonString from candidate is not empty
                        try {
                            const parsedJson = JSON.parse(jsonString);
                            setAiAnomalyDetected(parsedJson.anomalyDetected);
                            setAiAnomalyDetails(parsedJson.details);
                        } catch (parseError) {
                            console.error("Error parsing AI model JSON response from candidate:", parseError);
                            setAiAnomalyDetected(false);
                            setAiAnomalyDetails("AI candidate response format error.");
                        }
                    } else {
                        setAiAnomalyDetected(false);
                        setAiAnomalyDetails("AI candidate returned empty text.");
                    }
                } else {
                    setAiAnomalyDetected(false);
                    setAiAnomalyDetails("AI response structure unexpected or no candidates.");
                }
            } catch (error) {
                console.error("Error calling AI model (fetch or network issue):", error);
                setAiAnomalyDetected(false);
                setAiAnomalyDetails("AI analysis failed: " + error.message);
            } finally {
                setAiLoading(false); // Clear loading state
            }

        }, 1000); // Update every 1 second

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

    // Effect to detect problems based on simulated data and AI output
    useEffect(() => {
        let currentStatus = "Normal";
        let currentProblemDetails = "";

        // Helper function to update status and details
        const setProblem = (severity, message) => {
            if (severity === "Critical") {
                currentStatus = "Serious Problem";
                currentProblemDetails += `Critical: ${message} `;
            } else if (severity === "Warning" && currentStatus === "Normal") {
                currentStatus = "Warning";
                currentProblemDetails += `Warning: ${message} `;
            }
        };

        // Rule 1: High Engine Temperature
        if (engineTemp > TEMP_THRESHOLD) {
            highTempCountRef.current++;
            if (highTempCountRef.current >= CONSECUTIVE_HIGH_TEMP_LIMIT) {
                setProblem("Critical", "Engine overheating detected for too long!");
            } else {
                setProblem("Warning", `High engine temp (${engineTemp}°C).`);
            }
        } else {
            highTempCountRef.current = 0;
        }

        // Rule 2: Frequent Specific Error Code (Engine or Transmission)
        const relevantErrors = errorCodes.filter(
            (code) => code === SPECIFIC_ENGINE_ERROR_CODE || TRANSMISSION_ERROR_CODES.includes(code)
        );

        if (relevantErrors.length > 0) {
            const countRelevant = relevantErrors.length;
            if (countRelevant >= FREQUENT_ERROR_THRESHOLD) {
                setProblem("Critical", `Frequent specific errors detected (${countRelevant} times).`);
            } else {
                setProblem("Warning", `Specific error codes detected (${countRelevant} times).`);
            }
        }

        // Rule 3: Rough Gear Changes
        if (gearChangeSmoothness >= ROUGH_GEAR_THRESHOLD) {
            roughGearChangeCountRef.current++;
            if (roughGearChangeCountRef.current >= CONSECUTIVE_ROUGH_GEAR_LIMIT) {
                setProblem("Critical", `Persistent rough gear changes detected (smoothness: ${gearChangeSmoothness}).`);
            } else {
                setProblem("Warning", `Rough gear change detected (smoothness: ${gearChangeSmoothness}).`);
            }
        } else {
            roughGearChangeCountRef.current = 0;
        }

        // Rule 4: High Acceleration Sound
        if (accelerationSoundLevel >= HIGH_SOUND_THRESHOLD) {
            highSoundLevelCountRef.current++;
            if (highSoundLevelCountRef.current >= CONSECUTIVE_HIGH_SOUND_LIMIT) {
                setProblem("Critical", `Excessive acceleration sound detected (${accelerationSoundLevel}dB).`);
            } else {
                setProblem("Warning", `High acceleration sound detected (${accelerationSoundLevel}dB).`);
            }
        } else {
            highSoundLevelCountRef.current = 0;
        }

        // Rule 5: Low Transmission Oil Level
        if (transmissionOilLevel <= LOW_FLUID_THRESHOLD) {
            lowTransmissionOilCountRef.current++;
            if (lowTransmissionOilCountRef.current >= CONSECUTIVE_LOW_FLUID_LIMIT) {
                setProblem("Critical", `Low transmission oil level detected (${transmissionOilLevel}/10).`);
            } else {
                setProblem("Warning", `Transmission oil level low (${transmissionOilLevel}/10).`);
            }
        } else {
            lowTransmissionOilCountRef.current = 0;
        }

        // Rule 6: Low Engine Oil Level
        if (engineOilLevel <= LOW_FLUID_THRESHOLD) {
            lowEngineOilCountRef.current++;
            if (lowEngineOilCountRef.current >= CONSECUTIVE_LOW_FLUID_LIMIT) {
                setProblem("Critical", `Low engine oil level detected (${engineOilLevel}/10).`);
            } else {
                setProblem("Warning", `Engine oil level low (${engineOilLevel}/10).`);
            }
        } else {
            lowEngineOilCountRef.current = 0;
        }

        // Rule 7: Low Coolant Level
        if (coolantLevel <= LOW_FLUID_THRESHOLD) {
            lowCoolantCountRef.current++;
            if (lowCoolantCountRef.current >= CONSECUTIVE_LOW_FLUID_LIMIT) {
                setProblem("Critical", `Low coolant level detected (${coolantLevel}/10).`);
            } else {
                setProblem("Warning", `Coolant level low (${coolantLevel}/10).`);
            }
        } else {
            lowCoolantCountRef.current = 0;
        }

        // Rule 8: Leakage Detected
        if (leakageDetected) {
            leakageCountRef.current++;
            if (leakageCountRef.current >= CONSECUTIVE_LEAKAGE_LIMIT) {
                setProblem("Critical", "Potential fluid leakage detected!");
            }
        } else {
            leakageCountRef.current = 0;
        }

        // Rule 9: AI Model Anomaly Detection (New Rule)
        if (aiAnomalyDetected) {
            setProblem("Critical", `AI Anomaly: ${aiAnomalyDetails}`);
        }


        // Final status update (ensure "Serious Problem" takes precedence)
        if (currentProblemDetails.includes("Critical:")) {
            setCarStatus("Serious Problem");
        } else if (currentProblemDetails.includes("Warning:")) {
            setCarStatus("Warning");
        } else {
            setCarStatus("Normal");
        }

        setProblemDetails(currentProblemDetails || "All systems normal.");

    }, [
        engineTemp, errorCodes, gearChangeSmoothness, accelerationSoundLevel,
        transmissionOilLevel, engineOilLevel, coolantLevel, leakageDetected,
        aiAnomalyDetected, aiAnomalyDetails // Add new AI dependencies
    ]);

    // Determine color based on status
    const statusColorClass = carStatus === "Normal" ? "bg-green-500" :
                             carStatus === "Warning" ? "bg-yellow-500" :
                             "bg-red-600";

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
                    Car Problem Detector
                </h1>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3">Live Data:</h2>
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-2">
                        <span className="text-gray-600 font-medium">Engine Temperature:</span>
                        <span className="text-blue-600 font-bold text-lg">{engineTemp}°C</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-2">
                        <span className="text-gray-600 font-medium">Gear Change Smoothness:</span>
                        <span className="text-blue-600 font-bold text-lg">{gearChangeSmoothness}/10</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-2">
                        <span className="text-gray-600 font-medium">Acceleration Sound:</span>
                        <span className="text-blue-600 font-bold text-lg">{accelerationSoundLevel} dB</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-2">
                        <span className="text-gray-600 font-medium">Transmission Oil Level:</span>
                        <span className="text-blue-600 font-bold text-lg">{transmissionOilLevel}/10</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-2">
                        <span className="text-gray-600 font-medium">Engine Oil Level:</span>
                        <span className="text-blue-600 font-bold text-lg">{engineOilLevel}/10</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-2">
                        <span className="text-gray-600 font-medium">Coolant Level:</span>
                        <span className="text-blue-600 font-bold text-lg">{coolantLevel}/10</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-2">
                        <span className="text-gray-600 font-medium">Leakage Detected:</span>
                        <span className={`font-bold text-lg ${leakageDetected ? 'text-red-600' : 'text-green-600'}`}>
                            {leakageDetected ? 'YES' : 'NO'}
                        </span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-2">
                        <span className="text-gray-600 font-medium">Recent Error Codes:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {errorCodes.length > 0 ? (
                                errorCodes.map((code, index) => (
                                    <span key={index} className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                        {code}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 text-sm italic">No recent errors</span>
                            )}
                        </div>
                    </div>

                    {/* New AI Model Status Display */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="text-gray-600 font-medium">AI Anomaly Detection:</span>
                        <div className="mt-2 text-sm">
                            {aiLoading ? (
                                <span className="text-gray-500 italic">Analyzing...</span>
                            ) : (
                                <span className={`font-semibold ${aiAnomalyDetected ? 'text-red-600' : 'text-green-600'}`}>
                                    {aiAnomalyDetails}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3">Car Status:</h2>
                    <div className={`p-4 rounded-xl text-white font-bold text-2xl ${statusColorClass} shadow-md transition-colors duration-300`}>
                        {carStatus}
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3">Problem Details:</h2>
                    <p className="text-gray-700 text-md bg-gray-50 p-4 rounded-lg italic">
                        {problemDetails}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default App;
