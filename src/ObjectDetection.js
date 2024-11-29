import React, { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";

const ObjectDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);

  // Load TensorFlow.js and the object detection model (coco-ssd)
  useEffect(() => {
    const loadModel = async () => {
      await tf.ready(); // Ensure TensorFlow.js is ready
      const loadedModel = await cocoSsd.load(); // Load the model
      setModel(loadedModel);
      console.log("Model loaded");
    };

    loadModel();
  }, []);

  // Start the webcam feed
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        // Set the video stream to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play(); // Play the video after the stream is assigned
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startWebcam();

    // Cleanup webcam stream on component unmount
    return () => {
      const stream = videoRef.current?.srcObject;
      const tracks = stream?.getTracks();
      tracks?.forEach((track) => track.stop());
    };
  }, []); // Empty dependency array to run only once

  // Update the canvas size based on video size
  useEffect(() => {
    const video = videoRef.current;
    if (video && canvasRef.current) {
      // Wait until video metadata is loaded (videoWidth and videoHeight available)
      video.onloadedmetadata = () => {
        const { videoWidth, videoHeight } = video;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
      };
    }
  }, [videoRef.current]);

  // Object detection function
  const detectObjects = async () => {
    if (model && videoRef.current) {
      const predictions = await model.detect(videoRef.current);
      drawPredictions(predictions);
    }
  };

  // Draw the predictions on the canvas
  const drawPredictions = (predictions) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const video = videoRef.current;

    context.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height); // Draw current frame

    predictions.forEach((prediction) => {
      context.beginPath();
      context.rect(
        prediction.bbox[0],
        prediction.bbox[1],
        prediction.bbox[2],
        prediction.bbox[3]
      );
      context.lineWidth = 2;
      context.strokeStyle = "red";
      context.fillStyle = "red";
      context.stroke();
      context.fillText(
        `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
        prediction.bbox[0],
        prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
      );
    });
  };

  // Use the detection function every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      detectObjects();
    }, 100); // Run object detection every 100ms

    return () => clearInterval(interval); // Clean up interval when component unmounts
  }, [model]);

  return (
    <div>
      <h1>Real-Time Object Detection</h1>
      <video
        ref={videoRef}
        style={{ display: "none" }} // Hide the video element if you want to use the canvas only
        width="640"
        height="480"
        autoPlay
      />
      <canvas ref={canvasRef} width="640" height="480" />
    </div>
  );
};

export default ObjectDetection;
