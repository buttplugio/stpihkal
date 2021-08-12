# Prettylove

Prettylove is a line of App-controlled Bluetooth Vibrators.

## Device Identification

All Prettylove devices have a BLE name stating with "Aogu BLE", as well as same service and characteristic UUIDs.

## Bluetooth Details

**Service UUID**

```
0000ffe5-0000-1000-8000-00805f9b34fb
```

**Info (4 bytes, Read/Write/Notify) Characteristic UUID**

```
0000ffe2-0000-1000-8000-00805f9b34fb
```

**Control (2 bytes, Write) Characteristic UUID**

```
0000ffe9-0000-1000-8000-00805f9b34fb
```

## Protocol

The control protocol for the Vibratissimo allows the user to:

- Read the battery level
- Read device infos (product id, expected UI for app)
- Control motor(s)
- Control electro shock

### Info Characteristic Format

To trigger a notification or select the value to read, it is necessary to write `VOLT` (`0x564F4C54`) or `WNDS` (`0x574E4453`) to the characteristic first.

The format for read values is

```
0xAA 0xBB 0xCC 0xDD
```

If `BB` and `CC` are zero, then `AA` is the *battery level* as a percentage (0-100).

If `CC` is `0x40`, then `AABB` is the *product value* and `DD` is the *UI value*.

Product | *product value* | *UI value*
--- | --- | ---
Jefferson | `0000` | `0B`

### Control Characteristic Format

Control bytes are as follows:

```
0xAA 0xBB
```

Generally, `AA` is always `00` and `BB` controls the device. The exact meaning depends on the product.

`BB` | Description
--- | ---
`FF` | Disable all functions
`00` | Disable all vibrations
`01`-`0C` | Start various vibration patterns
`6E` | Disable electro shocks
`6F` | Enable electro shocks
`70` | Increase intensity of electro shocks
`71` | Reduce intensity of electro shocks
`C9`-`DC` | Trigger short vibration, where `C9` is the weakest and `DC` is the strongest
