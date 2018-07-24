# Petrainer Shock Collar

## Introduction

This document describes a way to control the
[Petrainer PET998DRB Dog Training Collar](https://www.amazon.com/gp/product/B00W6UVROK/)  
over 433Mhz-Band Radio Control.
The information was taken from the python2 code attached to this document, which was written by ???

## Communication via RF

The Petrainer listens to OOK on a 434Mhz carrier wave.

The RC-transmitted commands are bitwise encoded as

bit | pwm
--- | ---
0 | 1000
1 | 1110

Each message send is preceded by a 5 pwm-bit long high-signal, and every message is repeated 8 times, with pauses in between.

The provided code talks to an RFCat dongle, but a YardStickOne probably works as a drop-in-replacement.  
I wonder if [this contraption](https://rurandom.org/justintime/w/Cheapest_ever_433_Mhz_transceiver_for_PCs) would work also.

## Commands

Only the Shock function has been documented. The collar also has vibration and beeping capabilities which have not been documented so far.

Command | Description | Parameter
--- | --- | ---
Zap | Issues a static shock of specified strength| 0-100, high is strong

## Protocol

The Zap command looks like

```
01000000 11011101 00101011 10010100 00111111 00
0        8       16         ^^^^^^^
```

where bits no 25:32 (7 bits starting at the 26th) are the zap intensity as a binary number between 0b0000000 and 0b1100100

## Python script

The ported python3 script, which should work, provided rflib works with python3.
```python
"""
Module for connecting to a Petrainer Shock Collar and sending commands

This module implements a framework to send On-Off-Key-encoded messages
over radio using rfcat, and a class that controls the collar's shock function.

The code was originally written by # TODO
and was modified by definite_purple to hopefully work with python3.
Although she was not able to test it, because she doesn't have the hardware.

rflib can be obtained here: https://bitbucket.org/eviljonny/rflib
bitstring over pypi or here: https://github.com/scott-griffiths/bitstring

The code in this form was written for the buttplugio/stpihkal github repo
"""


import bitstring
import rflib
# import binascii

MHZ = 1000*1000

_COLLAR_BAUD_PWM = 4200  # The baud of the rc
_COLLAR_BAUD = _COLLAR_BAUD_PWM/4  # message bits get encoded to 4 radio bits
_COLLAR_FREQ = 434*MHZ


def _pwm_to_raw(pwm):
    """decodes messages received from the control unit"""
    raw = bitstring.BitStream()
    while True:
        try:
            nybble = pwm.read(4)
            if nybble.bin == "1110":
                raw += bitstring.Bits("0b1")
            elif nybble.bin == "1000":
                raw += bitstring.Bits("0b0")
            elif nybble.bin == "0000":
                pass  # radio silence. No info
            else:
                print(nybble)
                print(nybble.bin)
                raise ValueError("bad nybble")

        except bitstring.ReadError:
            break

    return raw


def _raw_to_pwm(raw):
    """encodes messages in preparation to sending them to the collar"""
    pwm = bitstring.BitStream()
    for bit in raw.bin:
        if bit == "0":
            pwm += bitstring.Bits("0b1000")
        else:
            pwm += bitstring.Bits("0b1110")

    return pwm


def configure_rfcat(d):
    """configures the rfcat dongle to the collar's language"""
    d.setFreq(_COLLAR_FREQ)
    d.setMdmModulation(rflib.MOD_ASK_OOK)
    d.setMdmDRate(_COLLAR_BAUD_PWM)


def tx_raw(d, raw, repeat=8):
    """magic. I don't understand it.

    adds 00000000000000011111 in front of the encoded part
    and  000000000000000000000000 behind it.
    Probably so the individual messages have a gap between them.
    I think there is a better way to achieve this.

    I don't know why the signal goes high for five pwm-bits before each
    transmission."""
    pwm = _raw_to_pwm(raw)
    tosend = bitstring.BitString(bytes=b"\x00\x01\xf0", length=(20)) \
        + pwm + bitstring.Bits(bytes=b"\x00\x00\x00")
    # print(tosend.hex)
    d.RFxmit(tosend.tobytes(), repeat=repeat)


def zap(d, intensity):
    """modifies a template with the shock intesity, and proceeds to transmit"""
    assert intensity <= 100
    assert intensity >= 0

    template = bitstring.BitString(
        bin="010000001101110100101011100101000011111100")
    template[25:32] = bitstring.Bits(uint=intensity, length=7)
    tx_raw(d, template)


class ShockCollar:
    """class for the shock collar"""
    def __init__(self):
        d = rflib.RfCat()
        configure_rfcat(d)
        self.d = d

    def shock(self, intensity=1.0):
        """accepts a number 0 <= intensity <= 1 and sends the shock command"""
        intensity_int = int(intensity*100.0)

        zap(self.d, intensity_int)

```

The original python2 script.
```python
import rflib
import binascii
import bitstring

MHZ=1000*1000

_COLLAR_BAUD_PWM=4200
_COLLAR_BAUD=_COLLAR_BAUD_PWM/4
_COLLAR_FREQ=434*MHZ

def _pwm_to_raw(pwm):
    raw = bitstring.BitStream()
    while True:
        try:
            nybble = pwm.read(4)
            if nybble.bin == "1110":
                raw += bitstring.Bits("0b1")
            elif nybble.bin == "1000":
                raw += bitstring.Bits("0b0")
            elif nybble.bin == "0000":
                pass #ew
            else:
                print nybble
                print nybble.bin
                raise ValueError("bad nybble")

        except bitstring.ReadError:
            break

    return raw

def _raw_to_pwm(raw):
    pwm = bitstring.BitStream()
    for bit in raw.bin:
        if bit == "0": pwm += bitstring.Bits("0b1000")
        else: pwm += bitstring.Bits("0b1110")

    return pwm


def configure_rfcat(d):
    d.setFreq(_COLLAR_FREQ)
    d.setMdmModulation(rflib.MOD_ASK_OOK)
    d.setMdmDRate(_COLLAR_BAUD_PWM)

def tx_raw(d, raw, repeat=8):
    pwm = _raw_to_pwm(raw)
    tosend = bitstring.BitString(bytes="\x00\x01\xf0", length=(20)) + pwm + bitstring.Bits(bytes="\x00\x00\x00")
    # print tosend.hex
    d.RFxmit(tosend.tobytes(), repeat=repeat)

def zap(d, intensity):
    assert intensity <= 100 
    assert intensity >= 0

    template=bitstring.BitString(bin="010000001101110100101011100101000011111100")
    template[25:32] = bitstring.Bits(uint=intensity, length=7)
    tx_raw(d, template)


class ShockCollar:
    def __init__(self):
        d = rflib.RfCat()
        configure_rfcat(d)
        self.d = d
    def shock(self, intensity=1.0):
        intensity_int = int(intensity*100.0)

        zap(self.d, intensity_int)
```
