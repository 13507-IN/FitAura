import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";

let backendReadyPromise;

export async function ensureTfBackend() {
  if (!backendReadyPromise) {
    backendReadyPromise = (async () => {
      await tf.setBackend("cpu");
      await tf.ready();
    })().catch((error) => {
      backendReadyPromise = undefined;
      throw error;
    });
  }

  return backendReadyPromise;
}
