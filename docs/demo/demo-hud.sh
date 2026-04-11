#!/bin/sh
printf '{"context_window":{"used_percentage":45},"session_id":"demo","rate_limits":{"five_hour":{"used_percentage":12}}}' | huddy
