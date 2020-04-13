# F-machine

F-machine is a UK sex toy company. Two or their products, the **Gigolo** fucking machine and the **Tremblr** male milking machine, can be controlled remotely via radio frequency (RF).

## Overview

Both Gigolo and Tremblr share the same protocol. The only difference is that the Tremblr has two additional buttons for controlling suction which are missing on the Gigolo.

The following three parameters can be controlled remotely:

- Power: Starts and stops the movement.
- Speed: Increases or decreases the stroke speed (= number of strokes per minute).
- Suction (Tremblr only): By increasing or decreasing suction, the receiver will stroke closer to the base or the tip of the shaft.

The stroke length can only be adjusted via a screw on the machine itself while power is turned off, and is not controllable remotely.

**Note:** The Tremblr has a fan which is always running as long as the hardware power switch is turned on, even while the motor itself is not moving. This produces a continuous white noise level. When designing long-running applications (e.g. an alarm clock), you may need a Smart Plug to turn the power on or off remotely, in addition to the infrastructure for sending commands to the toy.

## From radio to bits

The remote control uses a carrier frequency of 314.965 MHz and the signal is modulated with Amplitude-shift keying (ASK).

The actual signal is sent at roughly 3,562 Hz from the carrier frequency. Each bit is transmitted for roughly 1.72ms, and the amplitude is encoded in Differential Manchester:

- **on** (`1`): Full amplitude for 79% of the time, followed by no signal for the remaining 21%.
- **off** (`0`): Full amplitude for 33% of the time, followed by no signal for the remaining 67%.
- **silence** (`S`): No signal for the entire time.

Each message is 32 bits long, with the actual data sent in 25 bits, followed by 7 bits of total silence. Therefore, the protocol allows sending around 18 messages per second.

## Message structure

Each message starts with a 12 bit header:

```plaintext
1 1 1 1
0 1 0 1
0 1 0 1
```

The following 12 bits are the payload and describe which buttons are pressed; each buttons is sent as two bits. The first button is unused and is always sent as `0 0`. For the remaining buttons, if the button is pressed, `1 1` is sent, otherwise `0 0` is sent. Note that on the Gigolo, `suction_inc` and `suction_dec` will always be `0 0`.

```plaintext
0 0        suction_inc
speed_inc  speed_dec
power      suction_dec
```

Finally, a `0` bit is sent to terminate the message, followed by 7 bits of total silence before the next message can be sent:

```plaintext
0 S S S
S S S S
```

## Buttons

Note that a button has to pressed (encoded as `1 1`) for 8 consecutive messages in order to have an effect. Sending the button press for longer than 8 messages may increase the effect (see the following sections for details).

When a button press is no longer being sent, even if for just a single message and then pressed again, it will count as a new button press.

Keep in mind that we are assuming ideal connectivity. In reality, messages may be ignored by the machine and there is no acknowledgement built into the protocol. Also, the protocol is not idempotent; you cannot safely send a message a second time without causing potential side effects. Any application should be written with the assumption that some messages might randomly be dropped and ignored by the machine. Additional tracking sensors, e.g. visually (via camera) or spatially (via VR trackers), might be required to confirm message receipt.

### `power`

This button starts or stops the movement, depending on whether the machine is moving already.

The button is only considered pressed if it is sent for 8 or more consecutive messages. Any additional messages after the first 8 have no additional effect. In order to send a second button press (e.g. turn power off after turning it on) at least one message without a button press must be sent, or some silence. To increase reliability, send 15 messages which allows for a message at the start or end to be dropped, without being able to send a second command.

Note that the same message is sent for starting and stopping, therefore, an application cannot reliably put the machine in the moving or stopped state. Additional sensors might be required to detect movement. Alternatively, when using a Smart Plug you could cut power to the machine and then restore power, which will put the machine in the "not moving, at speed 1" state.

### `speed_inc` & `speed_dec`

These two buttons increase and decrease the motor speed, respectively. There are 32 discrete speeds.

Sending a button press for 8 messages changes the speed by 1 step. Sending the button press longer than that may change the speed by more than that, see below for details. When in the lowest speed, the speed decrease button has no effect, while in the highest speed, the speed increase button has no effect.

Note that when the machine is stopped via the `power` messages, the speed is persisted in memory and once another `power` command is sent, the machine will resume moving at the previous speed. You can also send commands to change the speed while the machine is not moving, and they will take effect as soon as the `power` command is sent. Turning off the power to the machine and restoring it will set the speed to 1 (the lowest speed).

#### List of speeds

The machine has 32 discrete speeds. We measured the following speeds of the Tremblr, given in revolutions per minute (RPM), which is identical to the number of strokes per minute:

|   # |       Speed |
| --: | ----------: |
|   1 |    16.5 rpm |
|   2 | 22.7-24 rpm |
|   3 |    30.5 rpm |
|   4 |    37.5 rpm |
|   5 |   44-45 rpm |
|   6 |      51 rpm |
|   7 |   57-58 rpm |
|   8 |   64-65 rpm |
|   9 |   70-71 rpm |
|  10 |   78-80 rpm |
|  11 |   85-86 rpm |
|  12 |   92-93 rpm |
|  13 |   97-99 rpm |
|  14 |      104 rp |
|  15 |     110 rpm |
|  16 |      119 rp |
|  17 |     125 rpm |
|  18 |     132 rpm |
|  19 |     139 rpm |
|  20 |      145 rp |
|  21 |     152 rpm |
|  22 |     159 rpm |
|  23 |     166 rpm |
|  24 |      174 rp |
|  25 |     181 rpm |
|  26 |     187 rpm |
|  27 |     193 rpm |
|  28 | 199-200 rpm |
|  29 | 204-212 rpm |
|  30 |     217 rpm |
|  31 |     224 rpm |
|  32 |     235 rpm |

Note that the speeds are mostly linear, with some discontinuities on the upper end which may be due to measurement errors. One approximation for the speed, given the step index, is `v(n) = 10 + (225 - 10) * n / 32`.

Also, keep in mind that while the absolute speed differences stay the same, the relative difference between e.g. speed 1 and 2 is much higher than between speed 20 and 21. Therefore, a user will definitely notice a change by 1 step in the lower speeds, while a change by 1 step in the higher speeds might not be perceived at all.

#### Amount of step changes based on number of messages

We measured the effect of sending more than 9 messages to the Tremblr to figure out if it is worth sending a longer button press instead of sending multiple 8-message long button presses. Based on our measurements, there is non-determinism when sending 16- to 22-message long button presses. These results showed up across multiple measurements, which rules out connectivity errors. Therefore, we recommend sticking with at most 15 messages for accurate speed control.

The following table contains our results, namely by how many steps the speed did change based on for how many messages the button press was sent. We used the methodology of always putting the machine in the slowest speed first, and then sending speed increase messages.

|     # messages | Change in # steps |
| -------------: | ----------------- |
|   1-7 messages | no effect         |
|   8-9 messages | +1                |
| 10-12 messages | +2                |
| 13-15 messages | +3                |
|    16 messages | +4 or +5 or +6    |
| 17-18 messages | +5 or +6          |
|    19 messages | +6 or +7          |
|    20 messages | +8 or +9          |
|    21 messages | +11 or +12        |
| 22-24 messages | +11               |
|    25 messages | +12               |
|    26 messages | +14               |

### `suction_inc` & `suction_dec`

These two buttons, only applicable to the Tremblr, change the amount of air in circulation. By increasing suction, the receiver will stroke closer to the base of the shaft, while decreasing suction causes the receiver to stroke closer to the tip of the shaft.

More specifically, these buttons control two valves which will either let more air in, or remove air. The valves are opened when at least 8 messages are sent, and stay open as long as the button press keeps being sent.

## Example messages

Here are two example messages.

### Power toggle

In this example, the power button is pressed, resulting in the following message:

```plaintext
1 1 1 1
0 1 0 1
0 1 0 1

0 0 0 0
0 0 0 0
1 1 0 0

0 S S S
S S S S
```

### Speed increase and suction decrease

Multiple buttons can be pressed at the same time. When the speed increase and suction decrease button is pressed, the following message is sent:

```plaintext
1 1 1 1
0 1 0 1
0 1 0 1

0 0 0 0
1 1 0 0
0 0 1 1

0 S S S
S S S S
```

## Hardware for sending RF signals

For sending RF signals from a computer, you need a RF device and an antenna. When shopping for a device, be aware that many RF devices (especially when they only cost \$50) can only be used for receiving signals; you'll need a device that can both receive and transmit signals.

Also, keep in mind that using a RF transmission device follows strict rules and regulations. The frequency that F-machine operates in, 314.965 MHz, is allowed for unlicensed, civilian use in most (if not all) jurisdictions but do not send at a higher power level or longer than necessary to avoid interfering in other people's equipment.

The HackRF One is an entry-level device and often comes bundled with a suitable antenna. Just download the required software for your operating system, connect the device to your computer via USB and you are good to go.

### Transmitting a message with HackRF One

For example, to send data from the file `data.bin` at the correct frequency with a sample rate of 2 million Hz, you'd use the following command:

```bash
hackrf_transfer -f 314965000 -x 30 -s 2000000 -t ./data.bin
```

### Generating a message

To generate the required `data.bin` file, you can use the following TypeScript file. Install [Deno](https://github.com/denoland/deno) and run with `deno --allow-write f-machine.ts`.

```typescript
const SAMPLES_PER_SECOND = 2_000_000;
const SIGNAL_FREQUENCY = SAMPLES_PER_SECOND / 561.4; // 3,562 Hz
const ANGULAR_FREQUENCY = 2 * Math.PI * SIGNAL_FREQUENCY;

function getSample(position: number, amplitude: number) {
  const real = amplitude * Math.sin(ANGULAR_FREQUENCY * position);
  const imag = amplitude * Math.cos(ANGULAR_FREQUENCY * position);
  return [real, imag];
}

function floatToInt(input: number) {
  return Math.round(
    input >= 0 ? Math.min(127, input * 127) : Math.max(-128, input * 128)
  );
}

function writeSamples(
  array: Int8Array,
  numSamples: number,
  offset: number,
  magnitude: number
) {
  for (let i = 0; i < numSamples; i += 1) {
    const [real, imag] = getSample(
      (offset + i) / SAMPLES_PER_SECOND,
      magnitude
    );
    array[i * BYTES_PER_SAMPLE] = floatToInt(real);
    array[i * BYTES_PER_SAMPLE + 1] = floatToInt(imag);
  }
}

const SAMPLES_PER_BIT = Math.round(1.72 * 0.001 * SAMPLES_PER_SECOND); // 1.72ms per bit
const BITS_PER_MESSAGE = 25;
const SILENCE_BITS = 7;
const BYTES_PER_SAMPLE = 2;

const WIDTH_SET = 0.79;
const WIDTH_UNSET = 0.334 * 2;

function getRawMessage(bits: ReadonlyArray<0 | 1>) {
  const array = new Int8Array(
    SAMPLES_PER_BIT * (BITS_PER_MESSAGE + SILENCE_BITS) * BYTES_PER_SAMPLE
  );

  for (let i = 0; i < BITS_PER_MESSAGE; i += 1) {
    const part = new Int8Array(
      array.buffer,
      i * SAMPLES_PER_BIT * BYTES_PER_SAMPLE,
      SAMPLES_PER_BIT * BYTES_PER_SAMPLE
    );

    if (bits[i] === 1) {
      writeSamples(
        part,
        SAMPLES_PER_BIT * WIDTH_SET,
        i * SAMPLES_PER_BIT * BYTES_PER_SAMPLE,
        2.3
      );
    } else {
      writeSamples(
        part,
        (SAMPLES_PER_BIT / 2) * WIDTH_UNSET,
        i * SAMPLES_PER_BIT * BYTES_PER_SAMPLE,
        2.3
      );

      // do nothing for other half since bytes are already zero
    }
  }

  // do nothing for empty space at the end, it is already zero

  return array;
}

interface Buttons {
  power?: true;
  speed?: "inc" | "dec";
  suction?: "inc" | "dec";
}

function getMessage(buttons: Buttons) {
  const bits = [
    // header
    1,
    1,
    1,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    0,
    1,
    // buttons
    0,
    0,
    buttons.suction === "inc" ? 1 : 0,
    buttons.suction === "inc" ? 1 : 0,
    buttons.speed === "inc" ? 1 : 0,
    buttons.speed === "inc" ? 1 : 0,
    buttons.speed === "dec" ? 1 : 0,
    buttons.speed === "dec" ? 1 : 0,
    buttons.power === true ? 1 : 0,
    buttons.power === true ? 1 : 0,
    buttons.suction === "dec" ? 1 : 0,
    buttons.suction === "dec" ? 1 : 0,
    // end
    0,
  ] as const;

  return getRawMessage(bits);
}

const MESSAGE: Buttons = { speed: "inc" };
const NUM_MESSAGES = 13;

await Deno.writeFile("./data.bin", new Uint8Array(SAMPLES_PER_SECOND / 2)); // 250ms of silence at the start
for (let m = 0; m < NUM_MESSAGES; m += 1) {
  const messageData = getMessage(MESSAGE);
  await Deno.writeFile("./data.bin", new Uint8Array(messageData.buffer), {
    append: true,
  });
}
console.log("Done writing to data.bin!");
```

## Related links

- [F-machine official website](https://www.f-machine.com/)
  - [Gigolo manual](https://f-machine.com/brochure/Gigolo_Brochure_Version2.pdf)
  - [Tremblr manual](https://f-machine.com/brochure/FINAL-TremblrBrochure.pdf)
- [HackRF One official website](https://greatscottgadgets.com/hackrf/one/)
