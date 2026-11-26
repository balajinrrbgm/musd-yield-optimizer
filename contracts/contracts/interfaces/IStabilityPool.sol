// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IStabilityPool {
    function provideToSP(uint256 _amount) external;
    function withdrawFromSP(uint256 _amount) external;
    function getDepositorCollateralGain(address _depositor) external view returns (uint256);
    function getCompoundedMUSDDeposit(address _depositor) external view returns (uint256);
    function getTotalMUSDDeposits() external view returns (uint256);
    function withdrawCollateralGainToTrove(address _upperHint, address _lowerHint) external;
}
