# Mysteryvibe

Mysteryvibe manufactuers the Crescendo, a reconfigurable stick
vibrator with 6 motors.

## Bluetooth Details

Different versions of the Crescendo firmware contain different numbers
of characteristics. For this writing, we are assuming the latest
firmware as of May 2018, which has 7 characteristics.

Not all of the characteristics have been mapped, as the device has
many functions including real time control, file loading, file
playback with boosting/intensity (features derived from the Crescendo
application GUI). 

The currently mapped characteristics are enough to get real time
control working with the vibrator.

**Main Service ID**

```
f0006900-110c-478b-b74b-6f403b364a9c
```

**Mode Characteristic (3 bytes, read/write/notify)**

```
f0006901-110c-478b-b74b-6f403b364a9c
```

Mode bytes are as follows:

```
0xXX 0x0Y 0xZZ
```

- X - Assumed to be some sort of status flag field. Starts out at 0x48 on boot.
  - Byte 0: On/Off (i.e. 0x48 plays nothing, 0x49 plays current pattern)
- Y - Unknown, seems to be either 0x01 or 0x02. Needs to be 0x02 for real time control
- ZZ - Unknown. Changes rapidly while playing patterns, could be some sort of memory offset.

**Control Chracteristic (6 bytes, read/write/notify)**

```
f0006902-110c-478b-b74b-6f403b364a9c
```

```
0x0a 0xWW 0x?? 0x?? 0x?? 0x??
```

- WW - On-board pattern index
- Rest of bytes unknown

**Motor Control Characteristic (6 bytes, read/write/notify)**

```
f0006903-110c-478b-b74b-6f403b364a9c
```

Motor Control bytes are as follows:
```
0xAA 0xBB 0xCC 0xDD 0xEE 0xFF
```

- AA - Motor level for Motor 1 (End with nubby bits), values 0x0-0x64. Ignores values > 0x64.
- BB - Motor level for Motor 2
- So on down through the 6th motor.

## Intialization

When the Crescendo application is started, the following command is
sent to the Mode Control Characteristic:

```
0x48 0x01 0x00
```

To flip the device to real time control mode, send the following
command to the Mode Control Characteristic:

```
0x43 0x02 0x00
```

This presumably mean play something, since 0x43 has the 0x1 flag
flipped.

## Control

Once the device is in real time control mode, motor values can be set
by writing 6 bytes to the Motor Control characteristic.

Writing bytes to this characteristic spins up the motor for a short
time, around ~80-85ms (note that this timing was derived experimentally,
and may be slightly different from the actual application distributed
by MysteryVibe). To keep a sustained pattern, update messages must be
sent frequently. It is currently unknown whether there is a device
mode that will sustain commands.

To set all vibrators to top speed, the following packet can be sent to
the motor control characteristic:

```
0x64 0x64 0x64 0x64 0x64 0x64
```

## Things to figure out

- Firmware loading
- Pattern loading retreival
- Mode field bits
- What the rest of the characteristics do
- Is there a way to sustain commands
