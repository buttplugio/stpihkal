# We-Vibe

## Bluetooth Details

**Main Service ID**

```
f000bb03-0451-4000-b000-000000000000
```

**Control Characteristic**

```
f000c000-0451-4000-b000-000000000000
```

The control characteristic takes 8 bytes, as follows:

```
0f PP 00 XY 00 0Z 00 00
```

- P - Vibration pattern
- X - Internal motor intensity
- Y - External motor intensity
- Z - The last two bits theoretically turn motors X and Y on/off, although it's
  unclear if this is actually used on all models.
  - `0x03` (`11`) - Both on
  - `0x02` (`10`) - X on
  - `0x01` (`01`) - Y on
  - `0x00` (`00`) - Both off

The vibration patterns are:

| Code   | Name      |
| ------ | --------- |
| `0x00` | Off       |
| `0x03` | Vibrate   |
| `0x04` | Peak      |
| `0x05` | Pulse     |
| `0x06` | Echo      |
| `0x07` | Wave      |
| `0x08` | Tide      |
| `0x0e` | Surf      |
| `0x0f` | Bounce    |
| `0x10` | Massage   |
| `0x11` | Tease     |
| `0x12` | Crest     |
| `0x13` | Chachacha |
| `0x14` | Step      |
| `0x15` | Ramp      |
| `0x16` | Tempo     |
| `0x17` | Heartbeat |

Note that a motor intensity of zero does not actually turn the motor off, for
that you will need to either use the `0x00` pattern, or perhaps the 6th byte of
the control characteristic.

**Info Charachteristic**

```
f000b000-0451-4000-b000-000000000000
```

This can be read, which results in the following 8 bytes:

```
01 PP ZZ ZZ ?? WW XY MM
```

- P - Vibration pattern
- Z - Battery usage. `FFFF` is 100%, `0000` is 0%.
- W - Temperature, in degrees Fahrenheit
- X - Internal motor intensity
- Y - External motor intensity
- M - Device model

The device models are:

| Code   | Name               | # motors | BLE name       |
| ------ | ------------------ | -------- | -------------- |
| `0x00` | Default dual-motor | 2        | default        |
| `0x02` | Jive               | 1        | jive           |
| `0x10` | Gala               | 2        | gala           |
| `0x20` | Verge              | 1        | verge          |
| `0x30` | Pivot              | 1        | pivot          |
| `0x35` | Classic            | 2        | classic        |
| `0x40` | Ditto              | 1        | ditto          |
| `0x45` | We-Vibe            | 2        | cougar / 4plus |
| `0x50` | Sync               | 2        | sync           |
| `0x60` | Bloom              | 1        | bloom          |
| `0x70` | Nova               | 2        | nova           |
| `0x80` | Wish               | 1        | wish           |
| `0x90` | Rave               | 1        | rave           |

## Vector/Moxie Changes

The Vector and Moxie devices [seem to have a different
protocol](https://github.com/buttplugio/stpihkal/issues/20#issuecomment-539400857).

## Sources

This document is based on the following sources:

* [We-Vibe working notes](https://gist.github.com/bnm12/fcdcef291a500bf51cef734aa1830e4d)
* [LabNotes: Reverse Engineering Sex Toys](https://mascherari.press/p/bff24725-f435-4e88-91de-16dafd95dc8c/)
* [The buttplug.io We-Vibe implementation](https://github.com/buttplugio/buttplug-rs/blob/master/buttplug/src/device/protocol/wevibe.rs)

As well as my own testing on a We-Vibe Sync.
