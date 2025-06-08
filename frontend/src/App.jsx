import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const categories = {
    bird: ['/sounds/bird1.wav', '/sounds/bird2.wav', '/sounds/bird3.wav'],
    carpass: ['/sounds/carpass1.mp3', '/sounds/carpass2.mp3', '/sounds/carpass3.mp3'],
    door: ['/sounds/door1.mp3', '/sounds/door2.mp3', '/sounds/door3.mp3'],
    engine: ['/sounds/engine1.mp3', '/sounds/engine2.mp3', '/sounds/engine3.mp3'],
    frog: ['/sounds/frog1.mp3', '/sounds/frog2.mp3', '/sounds/frog3.mp3'],
    snake: ['/sounds/snake1.mp3', '/sounds/snake2.mp3', '/sounds/snake3.mp3'],
    splash: ['/sounds/splash1.mp3', '/sounds/splash2.mp3', '/sounds/splash3.mp3'],
    train: ['/sounds/train1.mp3', '/sounds/train2.mp3', '/sounds/train3.mp3'],
    waterdrop: ['/sounds/waterdrop1.mp3', '/sounds/waterdrop2.mp3', '/sounds/waterdrop3.mp3'],
    waterpour: ['/sounds/waterpour1.mp3', '/sounds/waterpour2.mp3', '/sounds/waterpour3.mp3']
  };

  const maxAttempts = 3;
  const [attempts, setAttempts] = useState(0);
  const [clips, setClips] = useState([]);
  const [oddIndex, setOddIndex] = useState(null);
  const [status, setStatus] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState('challenge'); // "challenge" | "success" | "blocked"
  const [revealOddOne, setRevealOddOne] = useState(false);
  const audioCtx = useRef(null);

  useEffect(() => {
    audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    generateChallenge();
  }, []);

  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  function generateChallenge() {
    setStatus('');
    setInputValue('');
    setRevealOddOne(false);
    const cats = Object.keys(categories);
    let cat1 = cats[Math.floor(Math.random() * cats.length)];
    let cat2;
    do {
      cat2 = cats[Math.floor(Math.random() * cats.length)];
    } while (cat2 === cat1);

    const pool1 = shuffle(categories[cat1]).slice(0, 3);
    const odd = [categories[cat2][Math.floor(Math.random() * categories[cat2].length)]];
    const all = shuffle([...pool1, ...odd]);
    setClips(all);
    setOddIndex(all.findIndex((c) => odd.includes(c)));
  }

  async function playChallenge() {
    if (!audioCtx.current) return;
    setStatus('Playing sounds...');

    const hum = audioCtx.current.createOscillator();
    const humGain = audioCtx.current.createGain();
    hum.frequency.value = 60;
    humGain.gain.value = 0.02;
    hum.connect(humGain).connect(audioCtx.current.destination);
    hum.start();

    const playClip = async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();

        return new Promise((resolve) => {
          audioCtx.current.decodeAudioData(
            arrayBuffer,
            (buffer) => {
              const source = audioCtx.current.createBufferSource();
              source.buffer = buffer;
              source.playbackRate.value = 1 + (Math.random() * 0.1 - 0.05);
              source.connect(audioCtx.current.destination);
              source.start();
              source.onended = resolve;
            },
            (error) => {
              console.error(`Decoding failed for ${url}:`, error);
              setStatus(`Could not decode one of the sound files.`);
              resolve();
            }
          );
        });
      } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        setStatus(`Error playing ${url}`);
        return new Promise((res) => setTimeout(res, 500));
      }
    };

    for (let i = 0; i < clips.length; i++) {
      setStatus(`Playing sound ${i + 1} of 4`);
      await playClip(clips[i]);
      await new Promise((r) => setTimeout(r, 300));
    }

    hum.stop();
    setStatus('Enter the number of the odd sound (1–4) and submit.');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const idx = parseInt(inputValue, 10) - 1;

    if (isNaN(idx) || idx < 0 || idx > 3) {
      setStatus('Please enter a number between 1 and 4.');
      return;
    }

    if (idx === oddIndex) {
      setStatus('Correct!');
      setResult('success');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= maxAttempts) {
        setStatus('3/3 wrong. Access blocked.');
        setRevealOddOne(true);
        setResult('blocked');
      } else {
        setStatus(`Wrong. ${maxAttempts - newAttempts} attempts left. Try again.`);
        setTimeout(generateChallenge, 1000);
      }
    }

    setInputValue('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
        {result === 'challenge' && (
          <>
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">
              Odd-One-Out Audio CAPTCHA
            </h2>

            <div className="flex justify-center mb-4">
              <button
                className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2"
                onClick={playChallenge}
              >
                Play Sounds
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex items-center border-b border-teal-500 py-2">
              <input
                type="number"
                min="1"
                max="4"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter 1–4"
                className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
                aria-label='captcha answer'
              />
              <button
                type="submit"
                className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2"
              >
                Submit
              </button>
            </form>

            <p className="text-sm text-gray-700 mt-4 text-center">{status}</p>

            {revealOddOne && (
              <p className="text-sm text-red-600 text-center mt-2 font-semibold">
                The odd sound was number {oddIndex + 1}.
              </p>
            )}

            <p className="text-center text-xs text-gray-500 mt-2">
              Attempts: {attempts} / {maxAttempts}
            </p>
          </>
        )}

        {result === 'success' && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-green-600">✅ Welcome!</h2>
            <p className="text-gray-600">You successfully passed the audio CAPTCHA.</p>
          </div>
        )}

        {result === 'blocked' && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-600">🚫 Access Denied</h2>
            <p className="text-gray-600">You failed the challenge too many times.</p>
          </div>
        )}
      </div>
    </div>
  );
}
