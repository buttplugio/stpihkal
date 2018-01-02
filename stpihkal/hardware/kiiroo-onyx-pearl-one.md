# Kiiroo Onyx/Pearl 1

The Kiiroo Onyx 1 and Pearl 1 were a set of toys made to control each
other via Kiiroo's remote servers. The Onyx 1 was a tube with
constricting elements and a touch sensor slider, while the Pearl 1 was
a vibrator with 4 capacitive touch elements used to track insertion
depth.

## Bluetooth Details

### Bluetooth 2.0 Connections

When pairing using Bluetooth 2.0, serial ports on OS X and linux
machines will register for the Pearl toy as:

```
/dev/tty.PEARL-DevB 
```

and for the Onyx toy as:

```
/dev/tty.ONYX-DevB
```

### Bluetooth LE Connections

When using Bluetooth LE to talk to Kiiroo toys, the following UUIDs are used.

Service UUID:
```
49535343-fe7d-4ae5-8fa9-9fafd205e455
```

RX Characteristic UUID:
```
49535343-1e4d-4bd9-ba61-23c647249616
```

TX Characteristic UUID:
```
49535343-8841-43f4-a8d4-ecbe34729bb3
```

## Kiiroo Protocol

The Kiiroo communications protocol consists of strings send to either
the Pearl or Onyx. These strings are formatted like so:

```
x,\n
```

Where x is an integer from 0-4. When sent to the Onyx, this command
sets the pressure ring position. When sent to the Pearl, this command
sets vibration levels. 

These commands are sent from the Pearl whenever a corresponding touch
sensor is hit. There is no way to send commands from the Oynx.

That is it. That is the whole protocol. The end.

### Stupid Kiiroo Tricks

The simplicity of the protocol means that two toys can interact
locally on POSIX-compliant platforms (linux, OSX/macOS, etc) using nothing
but a 'cat' command. If both toys are paired using Bluetooth 2.0, so
that the Pearl is at

```
/dev/tty.PEARL-DevB 
```

and the Onyx is at

```
/dev/tty.ONYX-DevB
```

Then the following command can be run

```
cat /dev/tty.PEARL-DevB > /dev/tty.ONYX-DevB
```

This will cause the output from the Pearl's touch sensors to be read
directly into the Onyx, controlling its pressure rings.
